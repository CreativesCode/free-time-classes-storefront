import { gql } from "@apollo/client";

export const LESSON_STATUS_CHOICES = gql`
  query LessonStatusChoices {
    lessonStatusChoices {
      value
      displayName
    }
  }
`;

export const ALL_LESSONS_QUERY = gql`
  query AllLessons(
    $status: String
    $scheduledDateTimeGte: DateTime
    $scheduledDateTimeLte: DateTime
    $tutor: ID
    $student: ID
    $subject: ID
  ) {
    allLessons(
      status: $status
      scheduledDateTimeGte: $scheduledDateTimeGte
      scheduledDateTimeLte: $scheduledDateTimeLte
      tutor: $tutor
      student: $student
      subject: $subject
    ) {
      edges {
        node {
          id
          subject {
            name
            language {
              name
              level
            }
            description
            icon
          }
          scheduledDateTime
          priceAmount
          priceCurrency
          durationMinutes
          status
          createdAt
        }
      }
    }
  }
`;

export const LESSON_QUERY = gql`
  query Lesson($id: ID!) {
    lesson(id: $id) {
      id
      subject {
        name
        language {
          name
          level
        }
        description
        icon
        createdAt
      }
      scheduledDateTime
      durationMinutes
      status
      createdAt
      priceAmount
      priceCurrency
      tutor {
        user {
          id
        }
        firstName
        lastName
        email
        id
      }
    }
  }
`;

export const DELETE_LESSON_MUTATION = gql`
  mutation DeleteLesson($id: ID!) {
    deleteLesson(input: { id: $id }) {
      success
      clientMutationId
    }
  }
`;
