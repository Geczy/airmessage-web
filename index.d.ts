declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// declaration.d.ts
declare module "*.scss" {
  const content: Record<string, string>;
  export default content;
}

declare module "*.svg" {
  const content: any;
  export default content;
}

declare module "*.wav" {
  const content: any;
  export default content;
}

declare module "*.md" {
  const content: string;
  export default content;
}

declare const WPEnv: {
  ENVIRONMENT: "production" | "development";
  PACKAGE_VERSION: string;
  RELEASE_HASH: string | undefined;
  BUILD_DATE: number;
  WINRT: boolean;
};
