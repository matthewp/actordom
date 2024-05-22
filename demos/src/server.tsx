import { register, update, handler } from '../../src/server';

class ServerComponent {
  receive([name]: ['increment', Event]) {
    update(this);
  }
  view() {
    console.log("DOING THE VIEW!");
    debugger;
    return (
      <div>
        <h2>Server component</h2>
      </div>
    )
  }
}

export default register(ServerComponent, 'ServerComponent');

export {
  handler
};