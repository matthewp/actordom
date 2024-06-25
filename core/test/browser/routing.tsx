import QUnit from 'qunit';
import { type ProcessWithMessage, process, send, spawn, update, createWorkerConnection } from 'actordom';
import { router, listen } from 'actordom/worker';
import { mount } from 'actordom/dom';

QUnit.module('routing', () => {
  QUnit.test('vdom can be passed through remote actors', assert => {
		let done = assert.async();
		let channel = new MessageChannel();
		class Remote {
      data = [{ label: 'do chores' }, { label: 'walk the dog' }];
			receive([_name, data]: ['send', { sender: ProcessWithMessage<['view', actordom.JSX.Element]> }]) {
				let remote = 'remote';
				send(data.sender, 'view', (
					<>
						{this.data.map(item => (
              <div class="todo">{item.label}</div>
            ))}
					</>
				))
			}
		}

		let remoteRouter = router({
			Remote
		});
    let stopListening = listen(remoteRouter, channel.port1);
    let connection = createWorkerConnection<typeof remoteRouter>(channel.port2);
    channel.port1.start();
    channel.port2.start();

    let viewReceived = () => {
      let items = host.firstElementChild!;
      assert.equal(items.id, 'items');
      assert.equal(items.children.length, 2);
      assert.equal(items.firstChild?.textContent, 'do chores');
      assert.equal(items.firstChild?.nextSibling?.textContent, 'walk the dog');
      stopListening();
      done();
    };
				
    class Test {
      remote = spawn(connection.Remote);
      content: actordom.JSX.Element | null = null;
      receive([name, data]: ['start', true] | ['view', actordom.JSX.Element]){
        switch(name) {
          case 'start': {
            send(this.remote, 'send', { sender: process(this) });
            update(this);
            break;
          }
          case 'view': {
            this.content = data;
            update(this);
            viewReceived();
            break;
          }
        }
        
			}
      view() {
        return (
          <div id="items">
            {this.content}
          </div>
        )
      }
    }
    let host = document.createElement('div');
    let pid = spawn(Test);
    mount(pid, host);

    assert.equal(host.firstElementChild?.childNodes.length, 0, 'initially no children when null');
    send(pid, 'start', true);
  });
});
