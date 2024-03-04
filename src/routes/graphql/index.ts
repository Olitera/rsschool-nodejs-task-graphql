import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import {
  graphql,
  GraphQLBoolean, GraphQLEnumType,
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} from 'graphql';
import { UUIDType } from '../../routes/graphql/types/uuid.js';

const memberTypeId = new GraphQLEnumType({
  name: 'MemberTypeId',
  values: {
    basic: { value: 'basic' },
    business: { value: 'business' },
  }
});

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
});

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
});

const userSubscribedTo = new GraphQLObjectType({
  name: 'userSubscribedTo',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLString)
    },
    name: {
      type: new GraphQLNonNull(GraphQLString)
    },
    subscribedToUser: {
      type: subscribedToUser
    }
  })
});

const subscribedToUser = new GraphQLObjectType({
  name: 'subscribedToUser',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLString)
    },
    name: {
      type: new GraphQLNonNull(GraphQLString)
    },
    userSubscribedTo: {
      type: userSubscribedTo
    }
  })
});

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
      return await graphql({
        source,
        variableValues,
        schema: Schema
      });
    },
  });

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
      },
      memberTypeId: {
        type: new GraphQLNonNull(memberTypeId)
      },
      memberType: {
        type: memberTypes,
        resolve: (source) => {
          return prisma.memberType.findUnique({ where: { id: source.memberTypeId } });
        }
      }
    })
  });

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
      },
      profile: {
        type: profiles,
        resolve: (source) => {
          return prisma.profile.findUnique({ where: { userId: source.id } });
        }
      },
      posts: {
        type: new GraphQLList(posts),
        resolve: (source) => {
          return prisma.post.findMany({ where: { authorId: source.id } });
        }
      },
      userSubscribedTo: {
        type: new GraphQLList(users),
        resolve: (source) => {
          return prisma.subscribersOnAuthors.findMany({ where: { subscriberId: source.id }  })
            .then((subs)=> {
              return Promise.all(subs.map( (sub)=>
                prisma.user.findUnique({ where: { id: sub.authorId } })
              ))
            })
        }
      },
      subscribedToUser: {
        type: new GraphQLList(users),
        resolve: (source) => {
          return prisma.subscribersOnAuthors.findMany({ where: { authorId: source.id }  })
            .then((subs)=> {
              return Promise.all(subs.map( (sub)=>
                prisma.user.findUnique({ where: { id: sub.subscriberId } })
              ))
            })
        }
      }
    })
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
      memberType: {
        type: memberTypes,
        args: {
          id: {
            type: new GraphQLNonNull(memberTypeId)
          }
        },
        resolve: (_, args) => {
          return prisma.memberType.findUnique({ where: { id: args.id } });
        }
      },
      posts: {
        type: new GraphQLList(posts),
        resolve: () => {
          return prisma.post.findMany();
        }
      },
      post: {
        type: posts,
        args: {
          id: {
            type: UUIDType
          }
        },
        resolve: (_, args) => {
          return prisma.post.findUnique({ where: { id: args.id } });
        }
      },
      users: {
        type: new GraphQLList(users),
        resolve: () => {
          return prisma.user.findMany();
        },
      },
      user: {
        type: users,
        args: {
          id: {
            type: UUIDType
          }
        },
        resolve: (_, args) => {
          return prisma.user.findUnique({ where: { id: args.id } });
        }
      },
      profiles: {
        type: new GraphQLList(profiles),
        resolve: () => {
          return prisma.profile.findMany();
        }
      },
      profile: {
        type: profiles,
        args: {
          id: {
            type: UUIDType
          }
        },
        resolve: (_, args) => {
          return prisma.profile.findUnique({ where: { id: args.id } });
        }
      }
    })
  });

  const Schema = new GraphQLSchema({
    query: queryType,
    types: [memberTypes, posts, users, profiles]
  });
};

export default plugin;
