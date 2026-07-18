declare module "bwip-js" {
  const bwipjs: {
    toSVG(options: Record<string, unknown>): Promise<string>;
  };

  export default bwipjs;
}
