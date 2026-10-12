import { ROUTES } from '../../model';
export function generateStaticParams() { return ROUTES.map(route => ({ id: route.id })); }
export { PlannerScreen as default } from '../../ui/PlannerScreen';
