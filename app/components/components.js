import homeComponent from './home/home';
import aboutComponent from './about/about';
import heroComponent from './hero/hero';

export default app => {
  INCLUDE_ALL_MODULES([homeComponent, aboutComponent, heroComponent], app);
};

