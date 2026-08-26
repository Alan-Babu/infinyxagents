declare const ngDevMode: boolean | undefined;

const noop = () => undefined;

function isDevelopmentBuild(): boolean {
  return typeof ngDevMode !== 'undefined' && !!ngDevMode;
}

export function disableConsoleLogInProduction(): void {
  if (isDevelopmentBuild()) {
    return;
  }

  console.log = noop;
}
