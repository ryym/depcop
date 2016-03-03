import assert from 'power-assert';
import forEach from 'mocha-each';
import FileInfo from '$lib/FileInfo';
import ImportedModuleCollector from '$lib/codeAnalyzer/ImportedModuleCollector';

/** @test {ImportedModuleCollector} */
describe('ImportedModuleCollector', () => {
  const collector = new ImportedModuleCollector({
    ecmaVersion: 6,
    sourceType: 'module'
  });

  beforeEach(() => {
    collector.clearFoundModules();
  });

  forEach([
    ['recognizes various \'import\'s', {
      code: `
        import foo from 'foo';
        import * as bar from 'bar';
        import { member } from 'module1';
        import { ronald as ron } from 'module2';
        import { a, b, c as C } from 'module3';
        import almost, { member } from 'module4';
        import a, * as b from 'module5';
        import 'module6';
      `,
      modules: [
        'foo', 'bar',
        'module1', 'module2',
        'module3', 'module4',
        'module5', 'module6'
      ]
    }],
    ['ignores relative paths', {
      code: `
        import foo from 'foo';
        import bar from './bar';
        import baz from '../baz';
        import qux from './some/dir/qux';
        import quux from '../../../quux';
      `,
      modules: ['foo']
    }],
    ['ignores builtin modules (e.g. fs, path)', {
      code: `
        import fs from 'fs';
        import _foo from 'foo';
        import path from 'path';
        import crypto from 'crypto';
        import _bar from 'bar';
        import assert from 'assert';
        import _baz from 'baz';
      `,
      modules: ['foo', 'bar', 'baz']
    }],
    ['ignores modules in subdirectories', {
      code: `
        import foo from 'foo';
        import bar from 'bar/sub/a';
        import bar from 'bar/sub/b';
        import baz from 'baz/inner/SomeClass';
      `,
      modules: ['foo', 'bar', 'baz']
    }]
  ])
  .it('collects module information (%s)', (_, data) => {
    collector.searchImports(data.code, FileInfo.asAnonymous());
    const modules = collector.collectImportedModules();

    assert.deepEqual(
      modules.map(m => m.getName()),
      data.modules
    );
  });

  it('colletcs modules with a file information that uses the modules', () => {
    [
      [
        FileInfo.asLib('a.js'), `
          import module1 from 'module1';
          import module2 from 'module2'
        `
      ], [
        FileInfo.asLib('b.js'), `
          import module1 from 'module1';
          import module3 from 'module3';
        `
      ], [
        FileInfo.asLib('c.js'), `
          import module2 from 'module2';
          import module3 from 'module3';
        `
      ]
    ]
    .forEach(([fileInfo, code]) => {
      collector.searchImports(code, fileInfo);
    });

    const modules = collector.collectImportedModules()
      .reduce((ms, module) => {
        const paths = module.getDependents().map(f => f.getPath());
        ms[module.getName()] = paths;
        return ms;
      }, {});

    assert.deepEqual(modules, {
      module1: ['a.js', 'b.js'],
      module2: ['a.js', 'c.js'],
      module3: ['b.js', 'c.js']
    });
  });

});
