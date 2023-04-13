import React, { useState } from 'react';
import './App.css';
import { Link, Outlet } from "react-router-dom";
import {
  Anchor,
  AppShell,
  Navbar,
  Header,
  MediaQuery,
  Burger,
  useMantineTheme,
} from '@mantine/core';

import { NavLinks } from './_navLinks';
import { Login } from "./routes/login";

function App() {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const [token, setToken] = useState(null);

  console.log("Bearer access token:", token);

  if (!token) {
    return (
      <AppShell
          padding="md"

          header={
            <Header height={70} p="md">
              <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Anchor component={Link} to="/">
                  Maps Content Admin
                </Anchor>
              </div>
            </Header>
          }

          styles={(theme) => ({
            main: {
              backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : ''
            },
          })}
        >

        <Login setToken={setToken} />

      </AppShell>
    );
  }

  return (
    <AppShell
        padding="md"

        navbar={
          <Navbar p="md" hiddenBreakpoint="sm" hidden={!opened} width={{ sm: 200, lg: 300 }}>
            <NavLinks />
          </Navbar>
        }

        header={
          <Header height={70} p="md">
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
                <Burger
                  opened={opened}
                  onClick={() => setOpened((o) => !o)}
                  size="sm"
                  color={theme.colors.gray[6]}
                  mr="xl"
                />
              </MediaQuery>

              <Anchor component={Link} to="/">
                Maps Content Admin
              </Anchor>
            </div>
          </Header>
        }

        styles={(theme) => ({
          main: {
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : '',
          },
        })}
      >

      <Outlet />

    </AppShell>

  );
}

export default App;
