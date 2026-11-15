import NotFound from '../not-found';

// The proxy rewrites rejected slugs here. The Arabic RTL 404 UI is rendered as plain page content (as Next does for its
// own /_not-found route): a notFound() thrown in a dynamic render is answered with an empty `__next_error__` shell.
// The proxy sets the 404 status and noindex.
export default NotFound;
