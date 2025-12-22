/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = pgm => {
  pgm.createTable('users', {
    id: 'id',
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'text', notNull: true },
    name: { type: 'varchar(255)' },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'timestamp', default: pgm.func('now()') }
  });

  pgm.createTable('companies', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('now()') }
  });

  pgm.createType('company_role', [
    'platform_admin',
    'company_admin',
    'user'
  ]);

  pgm.createTable('company_users', {
    id: 'id',
    company_id: {
      type: 'integer',
      references: 'companies',
      onDelete: 'cascade',
      notNull: true
    },
    user_id: {
      type: 'integer',
      references: 'users',
      onDelete: 'cascade',
      notNull: true
    },
    role: {
      type: 'company_role',
      notNull: true
    },
    created_at: { type: 'timestamp', default: pgm.func('now()') }
  });

  pgm.addConstraint(
    'company_users',
    'unique_company_user',
    {
      unique: ['company_id', 'user_id']
    }
  );
};

exports.down = pgm => {
  pgm.dropTable('company_users');
  pgm.dropType('company_role');
  pgm.dropTable('companies');
  pgm.dropTable('users');
};

