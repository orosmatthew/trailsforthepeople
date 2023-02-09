import React from 'react';

import { Route, MapPin, Map, FileText } from 'tabler-icons-react';
import { ThemeIcon, UnstyledButton, Button, Group, Text } from '@mantine/core';

import { Link } from "react-router-dom";

interface NavLinkProps {
  icon: React.ReactNode;
  color: string;
  label: string;
  urlPath: string;
}

const navLinksData = [
  { icon: <Route />, color: 'blue', label: 'Loops', urlPath: 'loops' },
  { icon: <MapPin />, color: 'teal', label: 'Markers', urlPath: 'markers' },
  { icon: <Map />, color: 'violet', label: 'Hint Maps', urlPath: 'hintmaps' },
  { icon: <FileText />, color: 'grape', label: 'Logs', urlPath: 'logs' },
];

// For the sidebar menu link buttons
function NavLink({ icon, color, label, urlPath }: NavLinkProps) {
  return (
    <UnstyledButton
      component={Link}
      to={urlPath}
      sx={(theme) => ({
        display: 'block',
        width: '100%',
        padding: theme.spacing.xs,
        borderRadius: theme.radius.sm,
        color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,

        '&:hover': {
          backgroundColor:
            theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
        },
      })}
    >
      <Group>
        <ThemeIcon color={color} variant="light">{icon}</ThemeIcon>
        <Text size="sm">{label}</Text>
      </Group>
    </UnstyledButton>
  );
}

// For the home page buttons
function NavButton({ icon, color, label, urlPath }: NavLinkProps) {
  return (
    <Button
      variant="light"
      color={color}
      size="xl"
      component={Link}
      to={urlPath}
    >
      <Group>
        <ThemeIcon color={color} variant="light">{icon}</ThemeIcon>
        <Text size="xl">{label}</Text>
      </Group>
    </Button>
  );
}

// Sidebar menu link buttons
export function NavLinks() {
  const links = navLinksData.map((link) => <NavLink {...link} key={link.label} />);
  return <>{links}</>;
}

// Home page buttons
export function NavButtons() {
  const links = navLinksData.map((link) => <NavButton {...link} key={link.label} />);
  return <>{links}</>;
}