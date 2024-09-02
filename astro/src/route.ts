import type { APIRoute } from 'astro';
import { type GenericHTTP, sse } from 'actordom/sse';

let handleRequest = sse('/_actordom', 0 as any)

export const ALL: APIRoute = ({ request }) => {
  let responseResolve: (r: Response) => void;
  let responsePromise = new Promise<Response>(resolve => {
    responseResolve = resolve;
  })
  let headers = new Headers();
  let onRequestEnd = () => {};
  let responseDatas: string[] = [];
  let pushData = (value: string) => {
    responseDatas.push(value);
  }
  let stream = new ReadableStream({
    start(controller) {
      for(let chunk of responseDatas) {
        controller.enqueue(chunk);
      }
      responseDatas.length = 0;
      pushData = (chunk: string) => {
        controller.enqueue(chunk);
      };
    }
  });

  handleRequest({
    pathname: '',
    getCookies() {
      return request.headers.get('cookie');
    },
    setHeader(key, value) {
      headers.set(key, value);
    },
    setStatus(status) {
      let response = new Response(stream, {
        status,
        headers
      });
      responseResolve(response);
    },
    write(data) {
      pushData(data);
    },
    onRequestData(cb) {
      let reader = request.body?.getReader();
      (async function() {
        while(true) {
          let data = await reader?.read(); 
          if(data?.value) {
            cb(data.value);
          }
          if(data?.done) {
            break;
          } 
        }
        onRequestEnd();
      })();
    },
    onRequestEnd(cb) {
      onRequestEnd = cb;
    },
    endRequest() {
      // TODO?
      // Maybe needs a change in Astro
    }
  });

  return responsePromise;
};
