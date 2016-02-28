import assert from 'power-assert';
import path from 'path';
import configureDepcop from '$lib';

const FIXTURES_PATH = path.resolve(__dirname, './fixtures');
const makeDepcop = configureDepcop(__dirname);

function _makeDepcop(...checks) {
  return makeDepcop({
    checks,
    libSources: `${FIXTURES_PATH}/lib/**/*.js`,
    devSources: `${FIXTURES_PATH}/dev/**/*.js`
  });
}

function at(fileName) {
  const filePath = path.resolve(FIXTURES_PATH, fileName);
  return { path: filePath };
}

function format(modules) {
  return Object.keys(modules).sort().map(moduleName => {
    return {
      moduleName,
      at: modules[moduleName]
    };
  });
}

function assertReported(reports, expectedReports) {
  const dependencies = format(expectedReports.dependencies);
  const devDependencies = format(expectedReports.devDependencies);
  assert.deepEqual(reports.modules, { dependencies, devDependencies });
}

/**
 * Depcop integration test.
 */
describe('depcop', () => {
  it('detects modules which is used but unlisted in dependencies', () => {
    const results = _makeDepcop('unlisted').generateReport();

    assertReported(results[0], {
      dependencies: {
        'ul_used-in-lib': [
          at('lib/a.js'),
          at('lib/sub/b.js')
        ],
        'ul_used-in-both': [
          at('lib/a.js'),
          at('lib/sub/b.js'),
          at('dev/a.js'),
          at('dev/sub/b.js')
        ]
      },
      devDependencies: {
        'ul_used-in-dev': [
          at('dev/a.js'),
          at('dev/sub/b.js')
        ]
      }
    });
  });

  it('detects modules which is listed in dependencies but never used');

  it('detects modules which belongs to the wrong group');
});