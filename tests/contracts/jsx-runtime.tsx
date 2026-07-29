import {
  Box,
  Text,
  renderOnce,
  type VNode,
} from 'tuiuiu.js';

function Status(props: { label: string }): VNode {
  return <Text color="green">{props.label}</Text>;
}

const tree = (
  <box flexDirection="column" padding={1}>
    <text bold>JSX contract</text>
    <Status label="ready" />
  </box>
);

const componentTree = (
  <Box flexDirection="row">
    <Text>left</Text>
    <Text>right</Text>
  </Box>
);

const fragment = (
  <>
    <text>one</text>
    <newline />
    <text>two</text>
  </>
);

renderOnce(tree);
renderOnce(componentTree);
renderOnce(fragment);
