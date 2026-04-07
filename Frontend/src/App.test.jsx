import { render, screen } from '@testing-library/react';
import App from './App.jsx';

async function renderApp() {
  render(<App />);
  await screen.findByText(/repos:/i);
  await screen.findByTitle(/youtube video player/i);
}

test('renders the welcome heading', async () => {
  await renderApp();
  expect(screen.getByRole('heading', { name: /welcome to my web page/i })).toBeInTheDocument();
});

test('renders the GitHub link', async () => {
  await renderApp();
  const githubLink = screen.getByRole('link', { name: /github/i });
  expect(githubLink).toBeInTheDocument();
  expect(githubLink).toHaveAttribute('href', 'https://github.com/Lekematti');

  const todoRepoLink = await screen.findByRole('link', {
    name: /^todo$/i,
  });
  expect(todoRepoLink).toHaveAttribute('href', 'https://github.com/Lekematti/TODO');

  const innoRepoLink = await screen.findByRole('link', {
    name: /^inno$/i,
  });
  expect(innoRepoLink).toHaveAttribute('href', 'https://github.com/Lekematti/Inno');
});

test('renders the YouTube link', async () => {
  await renderApp();
  const youtubeTitleLink = screen.getByRole('link', { name: /^youtube$/i });
  expect(youtubeTitleLink).toBeInTheDocument();
  expect(youtubeTitleLink).toHaveAttribute('href', 'https://www.youtube.com/@lekematti');
  expect(screen.getByTitle(/youtube video player/i)).toBeInTheDocument();
});

test('renders the LinkedIn link', async () => {
  await renderApp();
  const linkedinLink = screen.getByRole('link', { name: /^linkedin$/i });
  expect(linkedinLink).toBeInTheDocument();
  expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/leokoskimaki/');
});

test('renders three preview panels', async () => {
  await renderApp();
  expect(screen.getByRole('heading', { name: /^github$/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /^youtube$/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /^linkedin$/i })).toBeInTheDocument();
});