import findStrayedModules from '$lib/validators/findStrayedModules';
import {
  makePackageJson,
  makeValidatorTester,
  module
} from './helper';

const packageJson = makePackageJson({
  deps: ['lib-a', 'lib-b'],
  devDeps: ['dev-a', 'dev-b', 'per-b'],
  peerDeps: ['per-a', 'per-b']
});

const testValidator = makeValidatorTester(
  packageJson, findStrayedModules
);

/** @test {findStrayedModules} */
describe('findStrayedModules()', () => {

  testValidator({}, [
    {
      title: 'reports nothing when all modules are used in correct places',
      modules: [
        module('lib-a', 'lib'),
        module('lib-b', 'lib'),
        module('dev-a', 'dev'),
        module('dev-b', 'dev')
      ],
      report: {
        dep: [],
        devDep: []
      }
    },
    {
      title: 'does not care about missing or unused modules',
      modules: [
        module('lib-a', 'lib'),
        module('lib-z', 'lib'),
        module('dev-a', 'dev'),
        module('dev-z', 'dev')
      ],
      report: {
        dep: [],
        devDep: []
      }
    },
    {
      title: `does not report if the module listed in  \`dependencies\` is
        used in both of lib sources and dev sources`,
      modules: [
        module('lib-a', 'lib', 'dev'),
        module('lib-b', 'lib')
      ],
      report: {
        dep: [],
        devDep: []
      }
    },
    {
      title: `does not report if the module is used in lib sources
        and listed in \`peerDependencies\``,
      modules: [
        module('lib-a', 'lib'),
        module('lib-b', 'dev'),
        module('dev-a', 'dev'),
        module('per-a', 'lib'),
        module('per-b', 'dev')
      ],
      report: {
        dep: ['lib-b'],
        devDep: []
      }
    },
    {
      title: `does not report if the dev-dependency module is used in
        lib sources but it is also listed in \`peerDependencies\``,
      modules: [
        module('per-b', 'lib')
      ],
      report: {
        dep: [],
        devDep: []
      }
    },
    {
      title: `reports as strayed dependency if the module is
        used only in dev sources but listed in \`dependencies\``,
      modules: [
        module('lib-a', 'div'),
        module('lib-b', 'dev'),
        module('dev-a', 'dev')
      ],
      report: {
        dep: ['lib-a', 'lib-b'],
        devDep: []
      }
    },
    {
      title: `reports as strayed dev-dependency if the module is
        used in lib sources but listed in \`devDependencies\``,
      modules: [
        module('lib-a', 'lib'),
        module('dev-a', 'lib'),
        module('dev-b', 'lib', 'dev')
      ],
      report: {
        dep: [],
        devDep: ['dev-a', 'dev-b']
      }
    },
    {
      title: `reports as strayed dependency if the module is
        used only in dev sources but listed only in \`peerDependencies\``,
      modules: [
        module('lib-a', 'lib'),
        module('per-a', 'dev'),
        module('dev-a', 'dev')
      ],
      report: {
        dep: ['per-a'],
        devDep: []
      }
    }
  ]);

  context('when only `dependencies` are target', () => {
    testValidator({
      devDependencies: false
    }, [
      {
        title: 'ignores strayed `devDependencies`',
        modules: [
          module('lib-a', 'lib'),
          module('lib-b', 'dev'),
          module('dev-a', 'lib'),
          module('dev-b', 'dev')
        ],
        report: {
          dep: ['lib-b'],
          devDep: []
        }
      }
    ]);
  });

  context('when only `devDependencies` are target', () => {
    testValidator({
      dependencies: false
    }, [
      {
        title: 'ignores strayed `dependencies`',
        modules: [
          module('lib-a', 'lib'),
          module('lib-b', 'dev'),
          module('dev-a', 'lib'),
          module('dev-b', 'dev')
        ],
        report: {
          dep: [],
          devDep: ['dev-a']
        }
      }
    ]);
  });

});

