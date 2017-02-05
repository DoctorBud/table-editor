import navbarComponent from './navbar/navbar';
import heroComponent from './hero/hero';

export default app => {
  INCLUDE_ALL_MODULES([navbarComponent, heroComponent], app);
};
