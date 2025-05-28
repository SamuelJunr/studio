import type { SVGProps } from 'react';
import { CircuitBoard } from 'lucide-react';

export function CompanyLogoIcon(props: SVGProps<SVGSVGElement>) {
  return <CircuitBoard className="h-16 w-16 text-primary" {...props} />;
}
