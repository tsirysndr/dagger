import { gql } from "../deps.ts";

export const hello = gql`
  query Hello($name: String!) {
    hello(name: $name)
  }
`;

export const add = gql`
  query Add($a: Int!, $b: Int!) {
    add(a: $a, b: $b)
  }
`;
