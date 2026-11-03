import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import WeatherClient from './WeatherClient';
import { siteConfig } from '../../siteConfig';

export const metadata = {
  title: '天气 | ' + siteConfig.title,
  description: '实时天气与一周预报',
};

export default function WeatherPage() {
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="mt-28">
          <WeatherClient />
        </div>
      </PageTransition>
    </div>
  );
}
