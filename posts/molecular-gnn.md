---
title: "把反应堆和分子塞进图里：一次分子模拟与图神经网络的联调"
category: "技术"
date: "2026-11-02 21:40:00"
description: "用图神经网络给分子动力学加速，从邻居列表到损失函数，一条能跑通的路。"
cover: "/media/img-17.webp"
tags: ["分子模拟", "图神经网络", "Python", "机器学习"]
---

做机器学习的人大概都熟悉这种场景：模型跑得比实验快，于是你开始怀疑它到底学到了什么。而做分子模拟的人刚好反过来——实验跑得太慢，慢到只能截取其中一小段，问模型能不能替我把剩下的一段补完。

这篇笔记记录我最近在做的这件事：拿一个简化版的小体系（几个粒子 + 一个粗糙的势能面）当数据源，训一个图神经网络，让它同时输出下一时刻的坐标和力，然后在轨迹对比里看它到底像不像。

## 先说清楚为什么是图

分子体系的自然表示就是图：

- **节点** = 原子，特征是元素种类、部分电荷、所属残基、空间位置；
- **边** = 原子对，作用半径 cutoff 之内连边，特征是距离、距离的径向基展开（RBF）、方向余弦；
- **全局特征** = 体系温度、总能量、盒子尺寸。

关键在于置换等变性：两个原子互换编号，物理上不应该有任何区别。所有消息传递的层数堆得再深，也只是让每个原子的表示依赖于它的邻域，而邻域本身又被规范成度数归一化的形式。

```python
import torch
import torch.nn as nn


class MessagePassing(nn.Module):
    """单层消息传递：边上的标量消息聚合到节点上。"""

    def __init__(self, hidden: int, cutoff: float = 5.0):
        super().__init__()
        self.cutoff = cutoff
        # 边 MLP：RBF 展开 -> 消息
        self.edge_mlp = nn.Sequential(
            nn.Linear(hidden, hidden),
            nn.SiLU(),
            nn.Linear(hidden, hidden),
        )
        # 节点更新 MLP
        self.node_mlp = nn.Sequential(
            nn.Linear(hidden * 2, hidden),
            nn.SiLU(),
            nn.Linear(hidden, hidden),
        )

    def forward(self, x, edge_index, edge_attr, edge_vec, batch):
        """x: [N, H]  节点特征
        edge_index: [2, E]  边索引
        edge_attr: [E, H]  边特征（已做 RBF 展开）
        edge_vec: [E, 3]  单位方向向量
        """
        src, dst = edge_index
        message = self.edge_mlp(edge_attr)

        # 按目标节点聚合（sum），并做度数归一化
        agg = torch.zeros_like(x)
        agg.index_add_(0, dst, message)
        deg = torch.zeros(x.size(0), device=x.device, dtype=x.dtype)
        deg.index_add_(0, dst, torch.ones_like(dst, dtype=x.dtype))
        agg = agg / (deg.unsqueeze(-1) + 1.0)

        # 方向信息：沿边方向把消息再分一份给源节点
        dir_msg = agg[src] * edge_vec

        out = self.node_mlp(torch.cat([x, agg + dir_msg], dim=-1))
        return out + x  # 残差连接，训练更稳
```

## 邻居列表是最容易出错的地方

我在这上面踩过一次很典型的坑：推理时用的 cutoff 比训练时大 0.1 Å，误差直接翻了四倍。原因不玄学——**图的边集变了**。模型学到的是"在这个邻域结构下的更新规则"，你把边集换掉，等于把问题换掉了。

所以训练和推理必须共用同一套建图逻辑，并且这个逻辑要写在 Dataset 里，而不是散落在训练脚本里。

```python
import numpy as np


def build_neighbor_list(positions, cutoff=5.0, max_neighbors=32, cell=None):
    """周期性边界下的邻居列表。
    positions: [N, 3]
    返回 (edge_index, edge_vec, edge_dist, mask)
    """
    n = positions.shape[0]
    # 用 cell 偏移做最小镜像约定
    delta = positions[:, None, :] - positions[None, :, :]
    if cell is not None:
        delta -= cell * np.round(delta / cell)
    dist = np.linalg.norm(delta, axis=-1)

    mask = (dist < cutoff) & (dist > 1e-6)
    # 屏蔽自己
    np.fill_diagonal(mask, False)

    src, dst = np.nonzero(mask)
    vec = delta[src, dst]
    d = dist[src, dst]

    # 每个节点最多保留 max_neighbors 个最近的邻居
    if len(src) > 0:
        order = np.lexsort((d, src))
        src, dst, vec, d = src[order], dst[order], vec[order], d[order]
        counts = np.bincount(src, minlength=n)
        keep_src, keep_dst, keep_vec, keep_d = [], [], [], []
        start = 0
        for c in counts:
            idx = np.arange(start, start + min(c, max_neighbors))
            keep_src.append(src[idx]); keep_dst.append(dst[idx])
            keep_vec.append(vec[idx]); keep_d.append(d[idx])
            start += c
        src = np.concatenate(keep_src); dst = np.concatenate(keep_dst)
        vec = np.concatenate(keep_vec); d = np.concatenate(keep_d)

    unit = vec / np.maximum(np.linalg.norm(vec, axis=-1, keepdims=True), 1e-9)
    edge_index = np.stack([src, dst])
    return edge_index, unit.astype(np.float32), d.astype(np.float32), mask
```

## 损失函数：力和能量要分开看

坐标直接回归 MSE 会让模型学得很"懒"——它倾向于输出一个安全的平均值，因为坐标误差的尺度不可控。更好的做法是把力当成向量的梯度来监督，而能量作为标量辅助任务。

```python
def force_loss(pred_force, true_force, sigma=10.0):
    """力的损失：先做归一化，否则大体系会把 loss 尺度拉爆。"""
    scale = sigma / (np.abs(true_force).mean() + 1e-8)
    return torch.mean((scale * (pred_force - true_force)) ** 2)


def energy_loss(pred_energy, true_energy):
    """能量的损失：按体系大小做归一化（每原子能量）。"""
    return torch.mean((pred_energy - true_energy) ** 2)


# 训练时的总损失
loss = force_loss(out.force, batch.force) + 0.1 * energy_loss(out.energy, batch.energy)
```

我的经验是：**力的权重比能量重要一个数量级**。能量错了模型还能凑合，力量错了轨迹就完全跑偏——因为积分器会把力误差当成速度误差直接累积。

## 轨迹对比比逐点误差更能说明问题

逐帧 RMSE 好看不代表轨迹对。真正要看的是沿时间方向的稳定性：模型会不会在某个高势垒区域"卡住"，或者在势阱里画出奇怪的圈。

```python
import matplotlib.pyplot as plt


def compare_trajectory(pred_traj, true_traj, atom_idx=0):
    """pred_traj / true_traj: [T, N, 3]"""
    t = np.arange(pred_traj.shape[0])
    err = np.linalg.norm(pred_traj[:, atom_idx] - true_traj[:, atom_idx], axis=-1)

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(t, err, lw=1.6, color="#b4613a")
    ax.set_xlabel("step")
    ax.set_ylabel("||r_pred - r_true||")
    ax.set_title(f"atom {atom_idx} trajectory error")
    ax.grid(alpha=0.25)
    plt.tight_layout()
    return fig, ax
```

## 还没解决的问题

1. **长程相互作用**：cutoff 之外的相互作用现在完全丢掉了，在长程静电显著的体系里误差积累很快。
2. **多保态**：双阱势垒那种场景，模型很容易学出"平均行为"，把两个态之间的跃迁抹平。
3. **速度依赖**：真正的 MD 里力还依赖速度，当前实现只有位置依赖的保守力。

这些都是可以继续做的方向。先把"能跑通"的部分记下来，剩下的留到下一篇。

## 小结

- 图天然契合分子体系，置换等变性靠度数归一化 + 方向消息来保；
- 邻居列表必须训练/推理共用同一份代码；
- 力的损失比能量重要得多；
- 评价要看轨迹稳定性，而不是逐点 RMSE。
