import { ROUTES } from '../../model';

export function generateStaticParams() {
  return ROUTES.map(route => ({ id: route.id }));
}

export { RouteDetailsScreen as default } from '../../ui/RouteDetailsScreen';
