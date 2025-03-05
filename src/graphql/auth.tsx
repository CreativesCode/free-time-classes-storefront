import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation TokenAuth($email: String!, $password: String!) {
    tokenAuth(email: $email, password: $password) {
      token
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation RevokeToken($refreshToken: String!) {
    revokeToken(refreshToken: $refreshToken) {
      revoked
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation CreateUser(
    $email: String!
    $password: String!
    $isStudent: Boolean!
    $isTutor: Boolean!
  ) {
    createUser(
      input: {
        email: $email
        password: $password
        isStudent: $isStudent
        isTutor: $isTutor
      }
    ) {
      user {
        username
        isStudent
        isTutor
        email
        profilePicture
      }
    }
  }
`;

export const GET_USER = gql`
  query {
    me {
      username
      email
      profilePicture
      isStudent
      isTutor
      isStaff
    }
  }
`;
