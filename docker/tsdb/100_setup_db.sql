-- Sets up database similar to how timescale cloud works where we have a
-- tsdbadmin user that is not a superuser. There is other stuff
-- that happens (see https://github.com/timescale/test-common/blob/main/src/cloud_init.sql)
-- but we don't need to worry about restore/dumping in localdev as would in cloud.
CREATE ROLE tsdbadmin
WITH
  LOGIN PASSWORD 'password';

CREATE DATABASE tsdb
WITH
  OWNER tsdbadmin;