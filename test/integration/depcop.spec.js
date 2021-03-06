import assert from 'power-assert';
import path from 'path';
import {
  FIXTURES_PATH,
  makeDepcop
} from './helper';

function _makeDepcop(checks) {
  return makeDepcop({ checks }, true);
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

function assertReported(result, expectedReports) {
  const { modules } = result.reports[0];
  const dependencies = format(expectedReports.dependencies);
  const devDependencies = format(expectedReports.devDependencies);
  assert.deepEqual(modules, { dependencies, devDependencies });
}

/**
 * Depcop integration test.
 */
describe('depcop', () => {
  it('detects modules which are used but unlisted in dependencies', () => {
    const result = _makeDepcop({
      missing: { ignore: ['\\$special'] }
    }).runValidations();

    assertReported(result, {
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

  it('detects modules which belongs to the wrong group', () => {
    const result = _makeDepcop({ strayed: {} }).runValidations();

    assertReported(result, {
      dependencies: {
        'lib_used-in-dev': [
          at('dev/a.js'),
          at('dev/sub/b.js')
        ]
      },
      devDependencies: {
        'dev_used-in-lib': [
          at('lib/a.js'),
          at('lib/sub/b.js')
        ],
        'dev_used-in-both': [
          at('lib/a.js'),
          at('lib/sub/b.js'),
          at('dev/a.js'),
          at('dev/sub/b.js')
        ]
      }
    });
  });

  it('detects modules which are listed in dependencies but never used', () => {
    const result = _makeDepcop({
      unused: { ignore: ['-somewhere$'] }
    }).runValidations();
    const pkgPath = path.join(FIXTURES_PATH, 'package.json');

    assertReported(result, {
      dependencies: {
        'lib_unused': [
          at(pkgPath)
        ]
      },
      devDependencies: {
        'dev_unused': [
          at(pkgPath)
        ]
      }
    });
  });

});
