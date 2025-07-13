import { useEffect, useRef } from 'react';
import { SvgDrawer, parse } from '@ibm-materials/ts-smiles-drawer';

// TODO:
export const Smiles = ({
  code,
  errorCallback,
}: {
  code: string;
  errorCallback: (error: unknown) => void;
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!code || !svgRef.current) return;

    const drawer = new SvgDrawer({});
    parse(
      code,
      (tree: unknown) => {
        drawer.draw(tree, svgRef.current, 'light');
      },
      (error: unknown) => {
        errorCallback(error);
      }
    );
  }, []);

  return (
    <div>
      <svg ref={svgRef} data-smiles={code} />
    </div>
  );
};
