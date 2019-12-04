import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v1Router } from './api/v1';
import { isProduction } from '../../../config';
import { ApolloServer, gql } from 'apollo-server-express';
import { getRecentPosts } from '../../../modules/forum/useCases/post/getRecentPosts'
import { PostDetailsMap } from '../../../modules/forum/mappers/postDetailsMap'
import { GraphQLDateTime } from 'graphql-iso-date';

const origin = {
  // origin: isProduction ? 'https://dddforum.com' : '*',
  origin: "*"
}

const app = express();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors(origin))
app.use(compression())
app.use(helmet())
app.use(morgan('combined'))

app.use('/api/v1', v1Router)

const typeDefs = gql`
  scalar DateTime

  type Query {
    posts: [Post]
  }

  enum PostType {
    text
    link
  }

  type Post {
    slug: String
    title: String
    createdAt: DateTime
    # memberPostedBy: MemberDTO;
    numComments: Int
    points: Int
    text: String
    link: String
    type: PostType
  }
`;

const server = new ApolloServer({
  typeDefs,
  resolvers: {
    DateTime: GraphQLDateTime,
    Query: {
      posts: async (parent, args, context) => {
        const response = await getRecentPosts.execute({ });
        if (response.isRight()) {
          const postDetails = response.value.getValue();
          return postDetails.map(PostDetailsMap.toDTO);
        } else {
          throw response.value;
        }
      }
    }
  }
});

server.applyMiddleware({ app });

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`[App]: Listening on port ${port}`)
})