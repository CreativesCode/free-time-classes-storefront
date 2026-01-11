import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation TokenAuth($email: String!, $password: String!) {
    tokenAuth(email: $email, password: $password) {
      token
      user {
        id
        username
        email
        profilePicture
        isStudent
        isTutor
        isStaff
        firstName
        lastName
        phone
        dateOfBirth
        country
      }
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
        id
        username
        email
        profilePicture
        isStudent
        isTutor
        isStaff
        firstName
        lastName
        phone
        dateOfBirth
        country
      }
    }
  }
`;

export const GET_USER = gql`
  query {
    me {
      id
      username
      email
      profilePicture
      isStudent
      isTutor
      isStaff
      firstName
      lastName
      phone
      dateOfBirth
      country
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser(
    $id: ID!
    $firstName: String
    $lastName: String
    $phone: String
    $profilePicture: String
    $dateOfBirth: Date
    $country: String
  ) {
    updateUser(
      input: {
        id: $id
        firstName: $firstName
        lastName: $lastName
        phone: $phone
        profilePicture: $profilePicture
        dateOfBirth: $dateOfBirth
        country: $country
      }
    ) {
      user {
        id
        username
        email
        profilePicture
        isStudent
        isTutor
        isStaff
        firstName
        lastName
        phone
        dateOfBirth
        country
      }
    }
  }
`;
