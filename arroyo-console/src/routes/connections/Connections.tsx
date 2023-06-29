import {
  Container,
  Stack,
  Heading,
  HStack,
  Button,
  Box,
  useColorModeValue,
  Table,
  Tbody,
  Th,
  Thead,
  Text,
  Tr,
  Icon,
  Code,
  Td,
  IconButton,
} from '@chakra-ui/react';
import { useLinkClickHandler } from 'react-router-dom';
import { Connection } from '../../gen/api_pb';
import { ApiClient } from '../../main';
import { PostConnections, useConnections } from '../../lib/data_fetching';
import React from 'react';
import { FiXCircle } from 'react-icons/fi';
import { components } from '../../gen/api-types';
import { oneOfName } from '../../lib/util';

interface ConnectionsState {
  connections: Array<Connection> | null;
}

interface ColumnDef {
  name: string;
  accessor: (s: PostConnections) => JSX.Element;
}

type ConnectionTypes = components['schemas']['ConnectionTypes'];

const icons = {
  // kafka: SiApachekafka,
  // kinesis: FaStream,
  // http: FaGlobeAmericas,
  // [components['schemas']['KafkaConnection']]: SiApachekafka,
};

const columns: Array<ColumnDef> = [
  {
    name: 'type',
    accessor: s => (
      <Stack direction="row">
        <Icon boxSize="5" as={icons[s.connectionType.case!]} />
        <Text>{s.connectionType.case!}</Text>
      </Stack>
    ),
  },
  {
    name: 'name',
    accessor: s => <Text>{s.name}</Text>,
  },
  {
    name: 'config',
    accessor: s => (
      <Box maxW={400} whiteSpace="pre-wrap">
        <Code>{JSON.stringify(s.connectionType.value!, null, 2)}</Code>
      </Box>
    ),
  },
  {
    name: 'sources',
    accessor: s => <Text>{s.sources}</Text>,
  },
  {
    name: 'sinks',
    accessor: s => <Text>{s.sinks}</Text>,
  },
];

function ConnectionTable({ client }: { client: ApiClient }) {
  // const [message, setMessage] = useState<string | null>();
  // const [isError, setIsError] = useState<boolean>(false);
  // const [state, setState] = useState<ConnectionsState>({ connections: null });
  const { connections } = useConnections();

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const resp = await (await client()).getConnections(new GetConnectionsReq({}));
  //
  //     setState({ connections: resp.connections });
  //   };
  //
  //   fetchData();
  // }, [message]);

  // const deleteConnection = async (connection: Connection) => {
  //   try {
  //     await (
  //       await client()
  //     ).deleteConnection(
  //       new DeleteConnectionReq({
  //         name: connection.name,
  //       })
  //     );
  //     setMessage(`Connection ${connection.name} successfully deleted`);
  //   } catch (e) {
  //     setIsError(true);
  //     if (e instanceof ConnectError) {
  //       setMessage(e.rawMessage);
  //     } else {
  //       setMessage('Something went wrong');
  //     }
  //   }
  // };

  // const onClose = () => {
  //   setMessage(null);
  //   setIsError(false);
  // };
  //
  // let messageBox = null;
  // if (message != null) {
  //   messageBox = (
  //     <Alert status={isError ? 'error' : 'success'} width="100%">
  //       <AlertIcon />
  //       <AlertDescription flexGrow={1}>{message}</AlertDescription>
  //       <CloseButton alignSelf="flex-end" right={-1} top={-1} onClick={onClose} />
  //     </Alert>
  //   );
  // }

  // const pc: PostConnections[] = connections;

  const getConnectionType = (connection: PostConnections) => {
    if (connection.config.http) {
      return 'http';
    }
    return 'unknown';
  };

  const tableBody = (
    <Tbody>
      {connections?.items.map(connection => (
        <Tr key={connection.name}>
          <Td key={'type'}>{oneOfName(connection.config)}</Td>
          <Td key={'name'}>{connection.name}</Td>
          <Td key={'config'}>{JSON.stringify(connection.config)}</Td>
          <Td key={'sources'}>todo</Td>
          <Td key={'sinks'}>todo</Td>

          <Td>
            <IconButton
              icon={<FiXCircle fontSize="1.25rem" />}
              variant="ghost"
              aria-label="Delete connection"
              // onClick={() => deleteConnection(connection)}
            />
          </Td>
        </Tr>
      ))}
    </Tbody>
  );

  return (
    <Stack spacing={2}>
      {/* {messageBox} */}
      <Table>
        <Thead>
          <Tr>
            {columns.map(c => {
              return (
                <Th key={c.name}>
                  <Text>{c.name}</Text>
                </Th>
              );
            })}
            <Th></Th>
          </Tr>
        </Thead>
        {tableBody}
      </Table>
    </Stack>
  );
}

export function Connections({ client }: { client: ApiClient }) {
  return (
    <Container py="8" flex="1">
      <Stack spacing={{ base: '8', lg: '6' }}>
        <Stack
          spacing="4"
          direction={{ base: 'column', lg: 'row' }}
          justify="space-between"
          align={{ base: 'start', lg: 'center' }}
        >
          <Stack spacing="1">
            <Heading size="sm" fontWeight="medium">
              Connections
            </Heading>
          </Stack>
          <HStack spacing="3">
            <Button variant="primary" onClick={useLinkClickHandler('/connections/new')}>
              Create Connection
            </Button>
          </HStack>
        </Stack>
        <Box
          bg="bg-surface"
          boxShadow={{ base: 'none', md: useColorModeValue('sm', 'sm-dark') }}
          borderRadius="lg"
        >
          <Stack spacing={{ base: '5', lg: '6' }}>
            <ConnectionTable client={client} />
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
