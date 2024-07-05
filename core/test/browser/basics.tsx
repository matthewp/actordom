import QUnit from 'qunit';
import { type Actor, type Process, spawn } from 'actordom';
import { mount } from 'actordom/dom';

QUnit.module('basics', t => {
  QUnit.test('boolean attributes', assert => {
    class Test {
      receive([]) {}
      view() {
        /** @ts-ignore */
        return <div one={true} two={false}>testing</div>
      }
    }
    let host = document.createElement('div');
    mount(spawn(Test), host);
    let el = host.firstElementChild!;
    assert.ok(el.hasAttribute('one'), 'has the one attribute');
    assert.equal(el.getAttribute('one'), '');
    assert.ok(!el.hasAttribute('two'));
  });

  QUnit.test('children', assert => {
    class One {
      receive(){}
      view(children: Process<Actor>) {
        return <div class="children">{children}</div>
      }
    }
    class Test {
      one = spawn(One);
      receive(){}
      view() {
        const One = this.one;
        return (
          <div>
            <One>
              <div class="inner">inner</div>
            </One>
          </div>
        );
      }
    }
    let host = document.createElement('div');
    mount(spawn(Test), host);
    let el = host.firstElementChild!;
    assert.ok(el.querySelector('.children'));
    assert.ok(el.querySelector('.children .inner'));
    assert.equal(el.querySelector('.children .inner')!.textContent, 'inner');
  });

  QUnit.test('conditionals', assert => {
    class Test {
      receive(){}
      view() {
        let page = {
          canPaginate: true,
          hasPagesBefore: false,
          beforePageLinks: [],
          hasPagesAfter: true,
          afterPageLinks: [2, 3, 4],
          previousPage: 0,
          nextPage: 2,
          currentPage: 1,
        };

        return (
          <nav class="pagination">
            <div class="false-test">
              {page.hasPagesBefore && (
                <a href={`?page=${page.previousPage}`}>Previous</a> 
              )}
            </div>
            {page.canPaginate && (
              <ol>
                {page.beforePageLinks.map(item => (
                  <li class="pagination-number">
                    <a href={`"?page=${item}`}>{item}</a>
                  </li> 
                ))}
                <li class="pagination-current">{page.currentPage}</li>
                {page.afterPageLinks.map(item => (
                  <li class="pagination-number">
                    <a href={`?page=${item}`}>{item}</a>
                  </li> 
                ))}
              </ol> 
            )}
            {page.hasPagesAfter && (
              <a href={`?page=${page.nextPage}`}>Next</a> 
            )}
          </nav>
        );
      }     
    }

    
    let host = document.createElement('div');
    mount(spawn(Test), host);
    let el = host.firstElementChild!;

    assert.equal(el.querySelectorAll('.false-test a').length, 0, 'falsey value not rendered');
    assert.equal((el as any).querySelector('.false-test').textContent.length, 0, 'falsey text not rendered');

    let numbers = Array.from(el.querySelectorAll('.pagination-number')).map(el => Number(el.textContent));
    assert.deepEqual(numbers, [2, 3, 4]);
  });
});

