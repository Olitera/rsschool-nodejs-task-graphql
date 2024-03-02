import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import {
  graphql,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} from 'graphql';

const memberTypes = new GraphQLObjectType({
  name: 'memberTypes',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLString)
    },
    discount: {
      type: new GraphQLNonNull(GraphQLFloat)
    },
    postsLimitPerMonth: {
      type: new GraphQLNonNull(GraphQLFloat)
    }
  })
  })

const posts = new GraphQLObjectType({
  name: 'posts',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLString)
    },
    title: {
      type: new GraphQLNonNull(GraphQLString)
    },
    content: {
      type: new GraphQLNonNull(GraphQLString)
    }
  })
})

const users = new GraphQLObjectType({
  name: 'users',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLString)
    },
    name: {
      type: new GraphQLNonNull(GraphQLString)
    },
    balance: {
      type: new GraphQLNonNull(GraphQLFloat)
    }
  })
})

const profiles = new GraphQLObjectType({
  name: 'profiles',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLString)
    },
    isMale: {
      type: new GraphQLNonNull(GraphQLBoolean)
    },
    yearOfBirth: {
      type: new GraphQLNonNull(GraphQLFloat)
    }
  })
})

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const prisma = fastify.prisma;

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      const source = req.body.query;
      const variableValues = req.body.variables;
      // console.log( req )
      return await graphql({
        source,
        variableValues,
        schema: Schema
      })
    },
  });

  const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      memberTypes: {
        type: new GraphQLList(memberTypes),
        resolve: () => {
          return prisma.memberType.findMany();
        }
      },
      posts: {
        type: new GraphQLList(posts),
        resolve: () => {
          return prisma.post.findMany();
        }
      },
      users: {
        type: new GraphQLList(users),
        resolve: () => {
          return prisma.user.findMany();
        }
      },
      profiles: {
        type: new GraphQLList(profiles),
        resolve: () => {
          return prisma.profile.findMany();
        }
      }
    })
  })

  const Schema = new GraphQLSchema({
    query: queryType,
    types: [memberTypes, posts, users, profiles]
  })
};

export default plugin;
