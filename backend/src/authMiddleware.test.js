const { requirePermission } = require('./middleware/authMiddleware');

describe('requirePermission middleware', () => {
  test('returns 401 when no user', () => {
    const mw = requirePermission('something');
    const req = {};
    const res = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('allows when user has permission', () => {
    const mw = requirePermission('x');
    const req = { user: { permissions: ['x'], roles: [] } };
    const res = {}; const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('allows Admin role regardless of permission', () => {
    const mw = requirePermission('y');
    const req = { user: { permissions: [], roles: ['Admin'] } };
    const res = {}; const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('denies when missing permission', () => {
    const mw = requirePermission('z');
    const req = { user: { permissions: ['a'], roles: [] } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
