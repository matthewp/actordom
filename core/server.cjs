const fastify = require('fastify')({logger: true})

fastify.register(require('@fastify/static'), {
  root: __dirname,
});

  fastify.listen({ port: 8023 }, (err, address) => {
    if (err) throw err
    // Server is now listening on ${address}
  })