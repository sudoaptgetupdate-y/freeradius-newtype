!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
BlastRADIUS check: Received packet without Proxy-State.
Setting "limit_proxy_state = true" for client mikrotik
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
The packet contains Message-Authenticator.
The client has likely been upgraded to protect from the attack.
Please set "require_message_authenticator = true" for client mikrotik
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
(3) Received Access-Request Id 44 from 10.0.0.1:58632 to 10.0.0.105:1812 length 242
(3)   NAS-Port-Type = Wireless-802.11
(3)   Calling-Station-Id = "BC:24:11:EB:56:4D"
(3)   Called-Station-Id = "hs-vlan888-hotspot"
(3)   NAS-Port-Id = "vlan888-hotspot"
(3)   User-Name = "thepumper"
(3)   NAS-Port = 2148532244
(3)   Acct-Session-Id = "80100014"
(3)   Framed-IP-Address = 10.5.88.2
(3)   Mikrotik-Host-IP = 10.5.88.2
(3)   CHAP-Challenge = 0x19a63ce2e283187f977609b470b01368
(3)   CHAP-Password = 0x34b7226284e0fdeddd5b12a8ee74e8b25c
(3)   Service-Type = Login-User
(3)   WISPr-Logoff-URL = "http://10.5.88.1/logout"
(3)   NAS-Identifier = "KhwanrichaiHome"
(3)   NAS-IP-Address = 10.0.0.1
(3)   Message-Authenticator = 0x7caaa284311d3b983154b05c38cbc9ee
(3) # Executing section authorize from file /etc/freeradius/3.0/sites-enabled/default
(3)   authorize {
(3)     policy filter_username {
(3)       if (&User-Name) {
(3)       if (&User-Name)  -> TRUE
(3)       if (&User-Name)  {
(3)         if (&User-Name =~ / /) {
(3)         if (&User-Name =~ / /)  -> FALSE
(3)         if (&User-Name =~ /@[^@]*@/ ) {
(3)         if (&User-Name =~ /@[^@]*@/ )  -> FALSE
(3)         if (&User-Name =~ /\.\./ ) {
(3)         if (&User-Name =~ /\.\./ )  -> FALSE
(3)         if ((&User-Name =~ /@/) && (&User-Name !~ /@(.+)\.(.+)$/))  {
(3)         if ((&User-Name =~ /@/) && (&User-Name !~ /@(.+)\.(.+)$/))   -> FALSE
(3)         if (&User-Name =~ /\.$/)  {
(3)         if (&User-Name =~ /\.$/)   -> FALSE
(3)         if (&User-Name =~ /@\./)  {
(3)         if (&User-Name =~ /@\./)   -> FALSE
(3)       } # if (&User-Name)  = notfound
(3)     } # policy filter_username = notfound
(3)     [preprocess] = ok
(3) chap:   &control:Auth-Type := CHAP
(3)     [chap] = ok
(3)     [mschap] = noop
(3)     [digest] = noop
(3) suffix: Checking for suffix after "@"
(3) suffix: No '@' in User-Name = "thepumper", looking up realm NULL
(3) suffix: No such realm "NULL"
(3)     [suffix] = noop
(3) eap: No EAP-Message, not doing EAP
(3)     [eap] = noop
(3)     [files] = noop
(3) sql: EXPAND %{User-Name}
(3) sql:    --> thepumper
(3) sql: SQL-User-Name set to 'thepumper'
rlm_sql (sql): Reserved connection (3)
(3) sql: EXPAND SELECT id, UserName, Attribute, Value, Op FROM radcheck WHERE Username = '%{SQL-User-Name}' ORDER BY id
(3) sql:    --> SELECT id, UserName, Attribute, Value, Op FROM radcheck WHERE Username = 'thepumper' ORDER BY id
(3) sql: Executing select query: SELECT id, UserName, Attribute, Value, Op FROM radcheck WHERE Username = 'thepumper' ORDER BY id
rlm_sql_postgresql: Status: PGRES_TUPLES_OK
rlm_sql_postgresql: query affected rows = 1 , fields = 5
(3) sql: User found in radcheck table
(3) sql: Conditional check items matched, merging assignment check items
(3) sql:   Cleartext-Password := "lkfgxifde"
(3) sql: EXPAND SELECT id, UserName, Attribute, Value, Op FROM radreply WHERE Username = '%{SQL-User-Name}' ORDER BY id
(3) sql:    --> SELECT id, UserName, Attribute, Value, Op FROM radreply WHERE Username = 'thepumper' ORDER BY id
(3) sql: Executing select query: SELECT id, UserName, Attribute, Value, Op FROM radreply WHERE Username = 'thepumper' ORDER BY id
rlm_sql_postgresql: Status: PGRES_TUPLES_OK
rlm_sql_postgresql: query affected rows = 0 , fields = 5
(3) sql: EXPAND SELECT GroupName FROM radusergroup WHERE UserName='%{SQL-User-Name}' ORDER BY priority
(3) sql:    --> SELECT GroupName FROM radusergroup WHERE UserName='thepumper' ORDER BY priority
(3) sql: Executing select query: SELECT GroupName FROM radusergroup WHERE UserName='thepumper' ORDER BY priority
rlm_sql_postgresql: Status: PGRES_TUPLES_OK
rlm_sql_postgresql: query affected rows = 1 , fields = 1
(3) sql: User found in the group table
(3) sql: EXPAND SELECT id, GroupName, Attribute, Value, op FROM radgroupcheck WHERE GroupName = '%{SQL-Group}' ORDER BY id
(3) sql:    --> SELECT id, GroupName, Attribute, Value, op FROM radgroupcheck WHERE GroupName = '20m/20m' ORDER BY id
(3) sql: Executing select query: SELECT id, GroupName, Attribute, Value, op FROM radgroupcheck WHERE GroupName = '20m/20m' ORDER BY id
rlm_sql_postgresql: Status: PGRES_TUPLES_OK
rlm_sql_postgresql: query affected rows = 0 , fields = 5
(3) sql: Group "20m/20m": Conditional check items matched
(3) sql: Group "20m/20m": Merging assignment check items
(3) sql: EXPAND SELECT id, GroupName, Attribute, Value, op FROM radgroupreply WHERE GroupName = '%{SQL-Group}' ORDER BY id
(3) sql:    --> SELECT id, GroupName, Attribute, Value, op FROM radgroupreply WHERE GroupName = '20m/20m' ORDER BY id
(3) sql: Executing select query: SELECT id, GroupName, Attribute, Value, op FROM radgroupreply WHERE GroupName = '20m/20m' ORDER BY id
rlm_sql_postgresql: Status: PGRES_TUPLES_OK
rlm_sql_postgresql: query affected rows = 1 , fields = 5
(3) sql: Group "20m/20m": Merging reply items
(3) sql:   Mikrotik-Rate-Limit = "20M/20M"
rlm_sql (sql): Released connection (3)
Need more connections to reach 10 spares
rlm_sql (sql): Opening additional connection (8), 1 of 24 pending slots used
rlm_sql_postgresql: Connecting using parameters: dbname='radius' host='localhost' port=5432 user='radius' password='radpass123' application_name='FreeRADIUS 3.2.5 - radiusd (sql)'
Connected to database 'radius' on 'localhost' server version 160014, protocol version 3, backend PID 370275
(3)     [sql] = ok
(3)     [expiration] = noop
(3)     [logintime] = noop
(3) pap: WARNING: Auth-Type already set.  Not setting to PAP
(3)     [pap] = noop
(3)   } # authorize = ok
(3) Found Auth-Type = CHAP
(3) # Executing group from file /etc/freeradius/3.0/sites-enabled/default
(3)   Auth-Type CHAP {
(3) chap: Comparing with "known good" Cleartext-Password
(3) chap: CHAP user "thepumper" authenticated successfully
(3)     [chap] = ok
(3)   } # Auth-Type CHAP = ok
(3) # Executing section post-auth from file /etc/freeradius/3.0/sites-enabled/default
(3)   post-auth {
(3)     if (session-state:User-Name && reply:User-Name && request:User-Name && (reply:User-Name == request:User-Name)) {
(3)     if (session-state:User-Name && reply:User-Name && request:User-Name && (reply:User-Name == request:User-Name))  -> FALSE
(3)     update {
(3)       No attributes updated for RHS &session-state:
(3)     } # update = noop
(3) sql: EXPAND .query
(3) sql:    --> .query
(3) sql: Using query template 'query'
rlm_sql (sql): Reserved connection (4)
(3) sql: EXPAND %{User-Name}
(3) sql:    --> thepumper
(3) sql: SQL-User-Name set to 'thepumper'
(3) sql: EXPAND INSERT INTO radpostauth (tenant_id, username, pass, reply, authdate ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = '%{SQL-User-Name}' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '%{NAS-IP-Address}' LIMIT 1) ), '%{User-Name}', '%{%{User-Password}:-%{Chap-Password}}', '%{reply:Packet-Type}', '%S.%M' )
(3) sql:    --> INSERT INTO radpostauth (tenant_id, username, pass, reply, authdate ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = 'thepumper' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '10.0.0.1' LIMIT 1) ), 'thepumper', '0x34b7226284e0fdeddd5b12a8ee74e8b25c', 'Access-Accept', '2026-06-30 00:33:02.184729' )
(3) sql: Executing query: INSERT INTO radpostauth (tenant_id, username, pass, reply, authdate ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = 'thepumper' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '10.0.0.1' LIMIT 1) ), 'thepumper', '0x34b7226284e0fdeddd5b12a8ee74e8b25c', 'Access-Accept', '2026-06-30 00:33:02.184729' )
rlm_sql_postgresql: Status: PGRES_COMMAND_OK
rlm_sql_postgresql: query affected rows = 1
(3) sql: SQL query returned: success
(3) sql: 1 record(s) updated
rlm_sql (sql): Released connection (4)
(3)     [sql] = ok
(3)     [exec] = noop
(3)     policy remove_reply_message_if_eap {
(3)       if (&reply:EAP-Message && &reply:Reply-Message) {
(3)       if (&reply:EAP-Message && &reply:Reply-Message)  -> FALSE
(3)       else {
(3)         [noop] = noop
(3)       } # else = noop
(3)     } # policy remove_reply_message_if_eap = noop
(3)     if (EAP-Key-Name && &reply:EAP-Session-Id) {
(3)     if (EAP-Key-Name && &reply:EAP-Session-Id)  -> FALSE
(3)   } # post-auth = ok
(3) Sent Access-Accept Id 44 from 10.0.0.105:1812 to 10.0.0.1:58632 length 53
(3)   Mikrotik-Rate-Limit = "20M/20M"
(3) Finished request
Waking up in 4.9 seconds.
(4) Received Accounting-Request Id 45 from 10.0.0.1:47863 to 10.0.0.105:1813 length 168
(4)   Acct-Status-Type = Start
(4)   NAS-Port-Type = Wireless-802.11
(4)   Calling-Station-Id = "BC:24:11:EB:56:4D"
(4)   Called-Station-Id = "hs-vlan888-hotspot"
(4)   NAS-Port-Id = "vlan888-hotspot"
(4)   User-Name = "thepumper"
(4)   NAS-Port = 2148532244
(4)   Acct-Session-Id = "80100014"
(4)   Framed-IP-Address = 10.5.88.2
(4)   Mikrotik-Host-IP = 10.5.88.2
(4)   Event-Timestamp = "Jun 30 2026 00:33:02 +07"
(4)   NAS-Identifier = "KhwanrichaiHome"
(4)   Acct-Delay-Time = 0
(4)   NAS-IP-Address = 10.0.0.1
(4) # Executing section preacct from file /etc/freeradius/3.0/sites-enabled/default
(4)   preacct {
(4)     [preprocess] = ok
(4)     policy acct_unique {
(4)       update request {
(4)         &Tmp-String-9 := "ai:"
(4)       } # update request = noop
(4)       if (("%{hex:&Class}" =~ /^%{hex:&Tmp-String-9}/) &&       ("%{string:&Class}" =~ /^ai:([0-9a-f]{32})/i)) {
(4)       EXPAND %{hex:&Class}
(4)          -->
(4)       EXPAND ^%{hex:&Tmp-String-9}
(4)          --> ^61693a
(4)       if (("%{hex:&Class}" =~ /^%{hex:&Tmp-String-9}/) &&       ("%{string:&Class}" =~ /^ai:([0-9a-f]{32})/i))  -> FALSE
(4)       else {
(4)         update request {
(4)           EXPAND %{md5:%{User-Name},%{Acct-Session-ID},%{%{NAS-IPv6-Address}:-%{NAS-IP-Address}},%{NAS-Identifier},%{NAS-Port-ID},%{NAS-Port}}
(4)              --> baf56d545295c3594bcd0e562847bcf2
(4)           &Acct-Unique-Session-Id := baf56d545295c3594bcd0e562847bcf2
(4)         } # update request = noop
(4)       } # else = noop
(4)       update request {
(4)         &Tmp-String-9 !* ANY
(4)       } # update request = noop
(4)     } # policy acct_unique = noop
(4) suffix: Checking for suffix after "@"
(4) suffix: No '@' in User-Name = "thepumper", looking up realm NULL
(4) suffix: No such realm "NULL"
(4)     [suffix] = noop
(4)     [files] = noop
(4)   } # preacct = ok
(4) # Executing section accounting from file /etc/freeradius/3.0/sites-enabled/default
(4)   accounting {
(4) detail: EXPAND /var/log/freeradius/radacct/%{%{Packet-Src-IP-Address}:-%{Packet-Src-IPv6-Address}}/detail-%Y%m%d
(4) detail:    --> /var/log/freeradius/radacct/10.0.0.1/detail-20260630
(4) detail: /var/log/freeradius/radacct/%{%{Packet-Src-IP-Address}:-%{Packet-Src-IPv6-Address}}/detail-%Y%m%d expands to /var/log/freeradius/radacct/10.0.0.1/detail-20260630
(4) detail: EXPAND %t
(4) detail:    --> Tue Jun 30 00:33:02 2026
(4)     [detail] = ok
(4)     [unix] = ok
(4) sql: EXPAND %{tolower:type.%{%{Acct-Status-Type}:-%{Request-Processing-Stage}}.query}
(4) sql:    --> type.start.query
(4) sql: Using query template 'query'
rlm_sql (sql): Reserved connection (0)
(4) sql: EXPAND %{User-Name}
(4) sql:    --> thepumper
(4) sql: SQL-User-Name set to 'thepumper'
(4) sql: EXPAND INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = '%{SQL-User-Name}' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '%{NAS-IP-Address}' LIMIT 1) ), '%{Acct-Session-Id}', '%{Acct-Unique-Session-Id}', '%{SQL-User-Name}', NULLIF('%{Realm}', ''), '%{%{NAS-IPv6-Address}:-%{NAS-IP-Address}}', NULLIF('%{%{NAS-Port-ID}:-%{NAS-Port}}', ''), '%{NAS-Port-Type}', TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), NULL, 0, '%{Acct-Authentic}', '%{Connect-Info}', NULL, 0, 0, '%{Called-Station-Id}', '%{Calling-Station-Id}', NULL, '%{Service-Type}', '%{Framed-Protocol}', NULLIF('%{Framed-IP-Address}', '')::inet, NULLIF('%{Framed-IPv6-Address}', '')::inet, NULLIF('%{Framed-IPv6-Prefix}', '')::inet, NULLIF('%{Framed-Interface-Id}', ''), NULLIF('%{Delegated-IPv6-Prefix}', '')::inet  ) ON CONFLICT (AcctUniqueId) DO UPDATE SET AcctStartTime = TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), AcctUpdateTime = TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), ConnectInfo_start = '%{Connect-Info}' WHERE radacct.AcctUniqueId = '%{Acct-Unique-Session-Id}' AND radacct.AcctStopTime IS NULL
(4) sql:    --> INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = 'thepumper' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '10.0.0.1' LIMIT 1) ), '80100014', 'baf56d545295c3594bcd0e562847bcf2', 'thepumper', NULLIF('', ''), '10.0.0.1', NULLIF('vlan888-hotspot', ''), 'Wireless-802.11', TO_TIMESTAMP(1782754382), TO_TIMESTAMP(1782754382), NULL, 0, '', '', NULL, 0, 0, 'hs-vlan888-hotspot', 'BC:24:11:EB:56:4D', NULL, '', '', NULLIF('10.5.88.2', '')::inet, NULLIF('', '')::inet, NULLIF('', '')::inet, NULLIF('', ''), NULLIF('', '')::inet  ) ON CONFLICT (AcctUniqueId) DO UPDATE SET AcctStartTime = TO_TIMESTAMP(1782754382), AcctUpdateTime = TO_TIMESTAMP(1782754382), ConnectInfo_start = '' WHERE radacct.AcctUniqueId = 'baf56d545295c3594bcd0e562847bcf2' AND radacct.AcctStopTime IS NULL
(4) sql: Executing query: INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = 'thepumper' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '10.0.0.1' LIMIT 1) ), '80100014', 'baf56d545295c3594bcd0e562847bcf2', 'thepumper', NULLIF('', ''), '10.0.0.1', NULLIF('vlan888-hotspot', ''), 'Wireless-802.11', TO_TIMESTAMP(1782754382), TO_TIMESTAMP(1782754382), NULL, 0, '', '', NULL, 0, 0, 'hs-vlan888-hotspot', 'BC:24:11:EB:56:4D', NULL, '', '', NULLIF('10.5.88.2', '')::inet, NULLIF('', '')::inet, NULLIF('', '')::inet, NULLIF('', ''), NULLIF('', '')::inet  ) ON CONFLICT (AcctUniqueId) DO UPDATE SET AcctStartTime = TO_TIMESTAMP(1782754382), AcctUpdateTime = TO_TIMESTAMP(1782754382), ConnectInfo_start = '' WHERE radacct.AcctUniqueId = 'baf56d545295c3594bcd0e562847bcf2' AND radacct.AcctStopTime IS NULL
rlm_sql_postgresql: Status: PGRES_FATAL_ERROR
rlm_sql_postgresql: 42P10: INVALID COLUMN REFERENCE
(4) sql: ERROR: rlm_sql_postgresql: ERROR:  there is no unique or exclusion constraint matching the ON CONFLICT specification
(4) sql: SQL query returned: server error
rlm_sql (sql): Released connection (0)
(4)     [sql] = fail
(4)   } # accounting = fail
(4) Not sending reply to client.
(4) Finished request
(4) Cleaning up request packet ID 45 with timestamp +19 due to done
Waking up in 4.9 seconds.
(5) Received Accounting-Request Id 45 from 10.0.0.1:47863 to 10.0.0.105:1813 length 168
(5)   Acct-Status-Type = Start
(5)   NAS-Port-Type = Wireless-802.11
(5)   Calling-Station-Id = "BC:24:11:EB:56:4D"
(5)   Called-Station-Id = "hs-vlan888-hotspot"
(5)   NAS-Port-Id = "vlan888-hotspot"
(5)   User-Name = "thepumper"
(5)   NAS-Port = 2148532244
(5)   Acct-Session-Id = "80100014"
(5)   Framed-IP-Address = 10.5.88.2
(5)   Mikrotik-Host-IP = 10.5.88.2
(5)   Event-Timestamp = "Jun 30 2026 00:33:02 +07"
(5)   NAS-Identifier = "KhwanrichaiHome"
(5)   Acct-Delay-Time = 0
(5)   NAS-IP-Address = 10.0.0.1
(5) # Executing section preacct from file /etc/freeradius/3.0/sites-enabled/default
(5)   preacct {
(5)     [preprocess] = ok
(5)     policy acct_unique {
(5)       update request {
(5)         &Tmp-String-9 := "ai:"
(5)       } # update request = noop
(5)       if (("%{hex:&Class}" =~ /^%{hex:&Tmp-String-9}/) &&       ("%{string:&Class}" =~ /^ai:([0-9a-f]{32})/i)) {
(5)       EXPAND %{hex:&Class}
(5)          -->
(5)       EXPAND ^%{hex:&Tmp-String-9}
(5)          --> ^61693a
(5)       if (("%{hex:&Class}" =~ /^%{hex:&Tmp-String-9}/) &&       ("%{string:&Class}" =~ /^ai:([0-9a-f]{32})/i))  -> FALSE
(5)       else {
(5)         update request {
(5)           EXPAND %{md5:%{User-Name},%{Acct-Session-ID},%{%{NAS-IPv6-Address}:-%{NAS-IP-Address}},%{NAS-Identifier},%{NAS-Port-ID},%{NAS-Port}}
(5)              --> baf56d545295c3594bcd0e562847bcf2
(5)           &Acct-Unique-Session-Id := baf56d545295c3594bcd0e562847bcf2
(5)         } # update request = noop
(5)       } # else = noop
(5)       update request {
(5)         &Tmp-String-9 !* ANY
(5)       } # update request = noop
(5)     } # policy acct_unique = noop
(5) suffix: Checking for suffix after "@"
(5) suffix: No '@' in User-Name = "thepumper", looking up realm NULL
(5) suffix: No such realm "NULL"
(5)     [suffix] = noop
(5)     [files] = noop
(5)   } # preacct = ok
(5) # Executing section accounting from file /etc/freeradius/3.0/sites-enabled/default
(5)   accounting {
(5) detail: EXPAND /var/log/freeradius/radacct/%{%{Packet-Src-IP-Address}:-%{Packet-Src-IPv6-Address}}/detail-%Y%m%d
(5) detail:    --> /var/log/freeradius/radacct/10.0.0.1/detail-20260630
(5) detail: /var/log/freeradius/radacct/%{%{Packet-Src-IP-Address}:-%{Packet-Src-IPv6-Address}}/detail-%Y%m%d expands to /var/log/freeradius/radacct/10.0.0.1/detail-20260630
(5) detail: EXPAND %t
(5) detail:    --> Tue Jun 30 00:33:03 2026
(5)     [detail] = ok
(5)     [unix] = ok
(5) sql: EXPAND %{tolower:type.%{%{Acct-Status-Type}:-%{Request-Processing-Stage}}.query}
(5) sql:    --> type.start.query
(5) sql: Using query template 'query'
rlm_sql (sql): Reserved connection (5)
(5) sql: EXPAND %{User-Name}
(5) sql:    --> thepumper
(5) sql: SQL-User-Name set to 'thepumper'
(5) sql: EXPAND INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = '%{SQL-User-Name}' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '%{NAS-IP-Address}' LIMIT 1) ), '%{Acct-Session-Id}', '%{Acct-Unique-Session-Id}', '%{SQL-User-Name}', NULLIF('%{Realm}', ''), '%{%{NAS-IPv6-Address}:-%{NAS-IP-Address}}', NULLIF('%{%{NAS-Port-ID}:-%{NAS-Port}}', ''), '%{NAS-Port-Type}', TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), NULL, 0, '%{Acct-Authentic}', '%{Connect-Info}', NULL, 0, 0, '%{Called-Station-Id}', '%{Calling-Station-Id}', NULL, '%{Service-Type}', '%{Framed-Protocol}', NULLIF('%{Framed-IP-Address}', '')::inet, NULLIF('%{Framed-IPv6-Address}', '')::inet, NULLIF('%{Framed-IPv6-Prefix}', '')::inet, NULLIF('%{Framed-Interface-Id}', ''), NULLIF('%{Delegated-IPv6-Prefix}', '')::inet  ) ON CONFLICT (AcctUniqueId) DO UPDATE SET AcctStartTime = TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), AcctUpdateTime = TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), ConnectInfo_start = '%{Connect-Info}' WHERE radacct.AcctUniqueId = '%{Acct-Unique-Session-Id}' AND radacct.AcctStopTime IS NULL
(5) sql:    --> INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = 'thepumper' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '10.0.0.1' LIMIT 1) ), '80100014', 'baf56d545295c3594bcd0e562847bcf2', 'thepumper', NULLIF('', ''), '10.0.0.1', NULLIF('vlan888-hotspot', ''), 'Wireless-802.11', TO_TIMESTAMP(1782754382), TO_TIMESTAMP(1782754382), NULL, 0, '', '', NULL, 0, 0, 'hs-vlan888-hotspot', 'BC:24:11:EB:56:4D', NULL, '', '', NULLIF('10.5.88.2', '')::inet, NULLIF('', '')::inet, NULLIF('', '')::inet, NULLIF('', ''), NULLIF('', '')::inet  ) ON CONFLICT (AcctUniqueId) DO UPDATE SET AcctStartTime = TO_TIMESTAMP(1782754382), AcctUpdateTime = TO_TIMESTAMP(1782754382), ConnectInfo_start = '' WHERE radacct.AcctUniqueId = 'baf56d545295c3594bcd0e562847bcf2' AND radacct.AcctStopTime IS NULL
(5) sql: Executing query: INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = 'thepumper' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '10.0.0.1' LIMIT 1) ), '80100014', 'baf56d545295c3594bcd0e562847bcf2', 'thepumper', NULLIF('', ''), '10.0.0.1', NULLIF('vlan888-hotspot', ''), 'Wireless-802.11', TO_TIMESTAMP(1782754382), TO_TIMESTAMP(1782754382), NULL, 0, '', '', NULL, 0, 0, 'hs-vlan888-hotspot', 'BC:24:11:EB:56:4D', NULL, '', '', NULLIF('10.5.88.2', '')::inet, NULLIF('', '')::inet, NULLIF('', '')::inet, NULLIF('', ''), NULLIF('', '')::inet  ) ON CONFLICT (AcctUniqueId) DO UPDATE SET AcctStartTime = TO_TIMESTAMP(1782754382), AcctUpdateTime = TO_TIMESTAMP(1782754382), ConnectInfo_start = '' WHERE radacct.AcctUniqueId = 'baf56d545295c3594bcd0e562847bcf2' AND radacct.AcctStopTime IS NULL
rlm_sql_postgresql: Status: PGRES_FATAL_ERROR
rlm_sql_postgresql: 42P10: INVALID COLUMN REFERENCE
(5) sql: ERROR: rlm_sql_postgresql: ERROR:  there is no unique or exclusion constraint matching the ON CONFLICT specification
(5) sql: SQL query returned: server error
rlm_sql (sql): Released connection (5)
Need more connections to reach 10 spares
rlm_sql (sql): Opening additional connection (9), 1 of 23 pending slots used
rlm_sql_postgresql: Connecting using parameters: dbname='radius' host='localhost' port=5432 user='radius' password='radpass123' application_name='FreeRADIUS 3.2.5 - radiusd (sql)'
Connected to database 'radius' on 'localhost' server version 160014, protocol version 3, backend PID 370283
(5)     [sql] = fail
(5)   } # accounting = fail
(5) Not sending reply to client.
(5) Finished request
(5) Cleaning up request packet ID 45 with timestamp +20 due to done
Waking up in 3.8 seconds.
(6) Received Accounting-Request Id 45 from 10.0.0.1:47863 to 10.0.0.105:1813 length 168
(6)   Acct-Status-Type = Start
(6)   NAS-Port-Type = Wireless-802.11
(6)   Calling-Station-Id = "BC:24:11:EB:56:4D"
(6)   Called-Station-Id = "hs-vlan888-hotspot"
(6)   NAS-Port-Id = "vlan888-hotspot"
(6)   User-Name = "thepumper"
(6)   NAS-Port = 2148532244
(6)   Acct-Session-Id = "80100014"
(6)   Framed-IP-Address = 10.5.88.2
(6)   Mikrotik-Host-IP = 10.5.88.2
(6)   Event-Timestamp = "Jun 30 2026 00:33:02 +07"
(6)   NAS-Identifier = "KhwanrichaiHome"
(6)   Acct-Delay-Time = 0
(6)   NAS-IP-Address = 10.0.0.1
(6) # Executing section preacct from file /etc/freeradius/3.0/sites-enabled/default
(6)   preacct {
(6)     [preprocess] = ok
(6)     policy acct_unique {
(6)       update request {
(6)         &Tmp-String-9 := "ai:"
(6)       } # update request = noop
(6)       if (("%{hex:&Class}" =~ /^%{hex:&Tmp-String-9}/) &&       ("%{string:&Class}" =~ /^ai:([0-9a-f]{32})/i)) {
(6)       EXPAND %{hex:&Class}
(6)          -->
(6)       EXPAND ^%{hex:&Tmp-String-9}
(6)          --> ^61693a
(6)       if (("%{hex:&Class}" =~ /^%{hex:&Tmp-String-9}/) &&       ("%{string:&Class}" =~ /^ai:([0-9a-f]{32})/i))  -> FALSE
(6)       else {
(6)         update request {
(6)           EXPAND %{md5:%{User-Name},%{Acct-Session-ID},%{%{NAS-IPv6-Address}:-%{NAS-IP-Address}},%{NAS-Identifier},%{NAS-Port-ID},%{NAS-Port}}
(6)              --> baf56d545295c3594bcd0e562847bcf2
(6)           &Acct-Unique-Session-Id := baf56d545295c3594bcd0e562847bcf2
(6)         } # update request = noop
(6)       } # else = noop
(6)       update request {
(6)         &Tmp-String-9 !* ANY
(6)       } # update request = noop
(6)     } # policy acct_unique = noop
(6) suffix: Checking for suffix after "@"
(6) suffix: No '@' in User-Name = "thepumper", looking up realm NULL
(6) suffix: No such realm "NULL"
(6)     [suffix] = noop
(6)     [files] = noop
(6)   } # preacct = ok
(6) # Executing section accounting from file /etc/freeradius/3.0/sites-enabled/default
(6)   accounting {
(6) detail: EXPAND /var/log/freeradius/radacct/%{%{Packet-Src-IP-Address}:-%{Packet-Src-IPv6-Address}}/detail-%Y%m%d
(6) detail:    --> /var/log/freeradius/radacct/10.0.0.1/detail-20260630
(6) detail: /var/log/freeradius/radacct/%{%{Packet-Src-IP-Address}:-%{Packet-Src-IPv6-Address}}/detail-%Y%m%d expands to /var/log/freeradius/radacct/10.0.0.1/detail-20260630
(6) detail: EXPAND %t
(6) detail:    --> Tue Jun 30 00:33:04 2026
(6)     [detail] = ok
(6)     [unix] = ok
(6) sql: EXPAND %{tolower:type.%{%{Acct-Status-Type}:-%{Request-Processing-Stage}}.query}
(6) sql:    --> type.start.query
(6) sql: Using query template 'query'
rlm_sql (sql): Reserved connection (1)
(6) sql: EXPAND %{User-Name}
(6) sql:    --> thepumper
(6) sql: SQL-User-Name set to 'thepumper'
(6) sql: EXPAND INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = '%{SQL-User-Name}' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '%{NAS-IP-Address}' LIMIT 1) ), '%{Acct-Session-Id}', '%{Acct-Unique-Session-Id}', '%{SQL-User-Name}', NULLIF('%{Realm}', ''), '%{%{NAS-IPv6-Address}:-%{NAS-IP-Address}}', NULLIF('%{%{NAS-Port-ID}:-%{NAS-Port}}', ''), '%{NAS-Port-Type}', TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), NULL, 0, '%{Acct-Authentic}', '%{Connect-Info}', NULL, 0, 0, '%{Called-Station-Id}', '%{Calling-Station-Id}', NULL, '%{Service-Type}', '%{Framed-Protocol}', NULLIF('%{Framed-IP-Address}', '')::inet, NULLIF('%{Framed-IPv6-Address}', '')::inet, NULLIF('%{Framed-IPv6-Prefix}', '')::inet, NULLIF('%{Framed-Interface-Id}', ''), NULLIF('%{Delegated-IPv6-Prefix}', '')::inet  ) ON CONFLICT (AcctUniqueId) DO UPDATE SET AcctStartTime = TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), AcctUpdateTime = TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), ConnectInfo_start = '%{Connect-Info}' WHERE radacct.AcctUniqueId = '%{Acct-Unique-Session-Id}' AND radacct.AcctStopTime IS NULL
(6) sql:    --> INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = 'thepumper' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '10.0.0.1' LIMIT 1) ), '80100014', 'baf56d545295c3594bcd0e562847bcf2', 'thepumper', NULLIF('', ''), '10.0.0.1', NULLIF('vlan888-hotspot', ''), 'Wireless-802.11', TO_TIMESTAMP(1782754382), TO_TIMESTAMP(1782754382), NULL, 0, '', '', NULL, 0, 0, 'hs-vlan888-hotspot', 'BC:24:11:EB:56:4D', NULL, '', '', NULLIF('10.5.88.2', '')::inet, NULLIF('', '')::inet, NULLIF('', '')::inet, NULLIF('', ''), NULLIF('', '')::inet  ) ON CONFLICT (AcctUniqueId) DO UPDATE SET AcctStartTime = TO_TIMESTAMP(1782754382), AcctUpdateTime = TO_TIMESTAMP(1782754382), ConnectInfo_start = '' WHERE radacct.AcctUniqueId = 'baf56d545295c3594bcd0e562847bcf2' AND radacct.AcctStopTime IS NULL
(6) sql: Executing query: INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = 'thepumper' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '10.0.0.1' LIMIT 1) ), '80100014', 'baf56d545295c3594bcd0e562847bcf2', 'thepumper', NULLIF('', ''), '10.0.0.1', NULLIF('vlan888-hotspot', ''), 'Wireless-802.11', TO_TIMESTAMP(1782754382), TO_TIMESTAMP(1782754382), NULL, 0, '', '', NULL, 0, 0, 'hs-vlan888-hotspot', 'BC:24:11:EB:56:4D', NULL, '', '', NULLIF('10.5.88.2', '')::inet, NULLIF('', '')::inet, NULLIF('', '')::inet, NULLIF('', ''), NULLIF('', '')::inet  ) ON CONFLICT (AcctUniqueId) DO UPDATE SET AcctStartTime = TO_TIMESTAMP(1782754382), AcctUpdateTime = TO_TIMESTAMP(1782754382), ConnectInfo_start = '' WHERE radacct.AcctUniqueId = 'baf56d545295c3594bcd0e562847bcf2' AND radacct.AcctStopTime IS NULL
rlm_sql_postgresql: Status: PGRES_FATAL_ERROR
rlm_sql_postgresql: 42P10: INVALID COLUMN REFERENCE
(6) sql: ERROR: rlm_sql_postgresql: ERROR:  there is no unique or exclusion constraint matching the ON CONFLICT specification
(6) sql: SQL query returned: server error
rlm_sql (sql): Released connection (1)
(6)     [sql] = fail
(6)   } # accounting = fail
(6) Not sending reply to client.
(6) Finished request
(6) Cleaning up request packet ID 45 with timestamp +21 due to done
Waking up in 2.7 seconds.
(3) Cleaning up request packet ID 44 with timestamp +19 due to cleanup_delay was reached
Ready to process requests
(7) Received Accounting-Request Id 46 from 10.0.0.1:47149 to 10.0.0.105:1813 length 216
(7)   Acct-Status-Type = Stop
(7)   Acct-Terminate-Cause = User-Request
(7)   NAS-Port-Type = Wireless-802.11
(7)   Calling-Station-Id = "BC:24:11:EB:56:4D"
(7)   Called-Station-Id = "hs-vlan888-hotspot"
(7)   NAS-Port-Id = "vlan888-hotspot"
(7)   User-Name = "thepumper"
(7)   NAS-Port = 2148532244
(7)   Acct-Session-Id = "80100014"
(7)   Framed-IP-Address = 10.5.88.2
(7)   Mikrotik-Host-IP = 10.5.88.2
(7)   Event-Timestamp = "Jun 30 2026 00:33:07 +07"
(7)   Acct-Input-Octets = 56
(7)   Acct-Output-Octets = 56
(7)   Acct-Input-Gigawords = 0
(7)   Acct-Output-Gigawords = 0
(7)   Acct-Input-Packets = 1
(7)   Acct-Output-Packets = 1
(7)   Acct-Session-Time = 5
(7)   NAS-Identifier = "KhwanrichaiHome"
(7)   Acct-Delay-Time = 0
(7)   NAS-IP-Address = 10.0.0.1
(7) # Executing section preacct from file /etc/freeradius/3.0/sites-enabled/default
(7)   preacct {
(7)     [preprocess] = ok
(7)     policy acct_unique {
(7)       update request {
(7)         &Tmp-String-9 := "ai:"
(7)       } # update request = noop
(7)       if (("%{hex:&Class}" =~ /^%{hex:&Tmp-String-9}/) &&       ("%{string:&Class}" =~ /^ai:([0-9a-f]{32})/i)) {
(7)       EXPAND %{hex:&Class}
(7)          -->
(7)       EXPAND ^%{hex:&Tmp-String-9}
(7)          --> ^61693a
(7)       if (("%{hex:&Class}" =~ /^%{hex:&Tmp-String-9}/) &&       ("%{string:&Class}" =~ /^ai:([0-9a-f]{32})/i))  -> FALSE
(7)       else {
(7)         update request {
(7)           EXPAND %{md5:%{User-Name},%{Acct-Session-ID},%{%{NAS-IPv6-Address}:-%{NAS-IP-Address}},%{NAS-Identifier},%{NAS-Port-ID},%{NAS-Port}}
(7)              --> baf56d545295c3594bcd0e562847bcf2
(7)           &Acct-Unique-Session-Id := baf56d545295c3594bcd0e562847bcf2
(7)         } # update request = noop
(7)       } # else = noop
(7)       update request {
(7)         &Tmp-String-9 !* ANY
(7)       } # update request = noop
(7)     } # policy acct_unique = noop
(7) suffix: Checking for suffix after "@"
(7) suffix: No '@' in User-Name = "thepumper", looking up realm NULL
(7) suffix: No such realm "NULL"
(7)     [suffix] = noop
(7)     [files] = noop
(7)   } # preacct = ok
(7) # Executing section accounting from file /etc/freeradius/3.0/sites-enabled/default
(7)   accounting {
(7) detail: EXPAND /var/log/freeradius/radacct/%{%{Packet-Src-IP-Address}:-%{Packet-Src-IPv6-Address}}/detail-%Y%m%d
(7) detail:    --> /var/log/freeradius/radacct/10.0.0.1/detail-20260630
(7) detail: /var/log/freeradius/radacct/%{%{Packet-Src-IP-Address}:-%{Packet-Src-IPv6-Address}}/detail-%Y%m%d expands to /var/log/freeradius/radacct/10.0.0.1/detail-20260630
(7) detail: EXPAND %t
(7) detail:    --> Tue Jun 30 00:33:07 2026
(7)     [detail] = ok
(7)     [unix] = ok
(7) sql: EXPAND %{tolower:type.%{%{Acct-Status-Type}:-%{Request-Processing-Stage}}.query}
(7) sql:    --> type.stop.query
(7) sql: Using query template 'query'
rlm_sql (sql): Reserved connection (6)
(7) sql: EXPAND %{User-Name}
(7) sql:    --> thepumper
(7) sql: SQL-User-Name set to 'thepumper'
(7) sql: EXPAND UPDATE radacct SET AcctStopTime = TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), AcctUpdateTime = TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), AcctSessionTime = COALESCE(%{%{Acct-Session-Time}:-NULL}, (%{%{integer:Event-Timestamp}:-%l} - EXTRACT(EPOCH FROM(AcctStartTime)))), AcctInputOctets = (('%{%{Acct-Input-Gigawords}:-0}'::bigint << 32) + '%{%{Acct-Input-Octets}:-0}'::bigint), AcctOutputOctets = (('%{%{Acct-Output-Gigawords}:-0}'::bigint << 32) + '%{%{Acct-Output-Octets}:-0}'::bigint), AcctTerminateCause = '%{Acct-Terminate-Cause}', FramedIPAddress = NULLIF('%{Framed-IP-Address}', '')::inet, FramedIPv6Address = NULLIF('%{Framed-IPv6-Address}', '')::inet, FramedIPv6Prefix = NULLIF('%{Framed-IPv6-Prefix}', '')::inet, FramedInterfaceId = NULLIF('%{Framed-Interface-Id}', ''), DelegatedIPv6Prefix = NULLIF('%{Delegated-IPv6-Prefix}', '')::inet, ConnectInfo_stop = '%{Connect-Info}' WHERE AcctUniqueId = '%{Acct-Unique-Session-Id}' AND AcctStopTime IS NULL
(7) sql:    --> UPDATE radacct SET AcctStopTime = TO_TIMESTAMP(1782754387), AcctUpdateTime = TO_TIMESTAMP(1782754387), AcctSessionTime = COALESCE(5, (1782754387 - EXTRACT(EPOCH FROM(AcctStartTime)))), AcctInputOctets = (('0'::bigint << 32) + '56'::bigint), AcctOutputOctets = (('0'::bigint << 32) + '56'::bigint), AcctTerminateCause = 'User-Request', FramedIPAddress = NULLIF('10.5.88.2', '')::inet, FramedIPv6Address = NULLIF('', '')::inet, FramedIPv6Prefix = NULLIF('', '')::inet, FramedInterfaceId = NULLIF('', ''), DelegatedIPv6Prefix = NULLIF('', '')::inet, ConnectInfo_stop = '' WHERE AcctUniqueId = 'baf56d545295c3594bcd0e562847bcf2' AND AcctStopTime IS NULL
(7) sql: Executing query: UPDATE radacct SET AcctStopTime = TO_TIMESTAMP(1782754387), AcctUpdateTime = TO_TIMESTAMP(1782754387), AcctSessionTime = COALESCE(5, (1782754387 - EXTRACT(EPOCH FROM(AcctStartTime)))), AcctInputOctets = (('0'::bigint << 32) + '56'::bigint), AcctOutputOctets = (('0'::bigint << 32) + '56'::bigint), AcctTerminateCause = 'User-Request', FramedIPAddress = NULLIF('10.5.88.2', '')::inet, FramedIPv6Address = NULLIF('', '')::inet, FramedIPv6Prefix = NULLIF('', '')::inet, FramedInterfaceId = NULLIF('', ''), DelegatedIPv6Prefix = NULLIF('', '')::inet, ConnectInfo_stop = '' WHERE AcctUniqueId = 'baf56d545295c3594bcd0e562847bcf2' AND AcctStopTime IS NULL
rlm_sql_postgresql: Status: PGRES_COMMAND_OK
rlm_sql_postgresql: query affected rows = 0
(7) sql: SQL query returned: success
(7) sql: 0 record(s) updated
(7) sql: Trying next query...
(7) sql: EXPAND INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = '%{SQL-User-Name}' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '%{NAS-IP-Address}' LIMIT 1) ), '%{Acct-Session-Id}', '%{Acct-Unique-Session-Id}', '%{SQL-User-Name}', NULLIF('%{Realm}', ''), '%{%{NAS-IPv6-Address}:-%{NAS-IP-Address}}', NULLIF('%{%{NAS-Port-ID}:-%{NAS-Port}}', ''), '%{NAS-Port-Type}', TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l} - %{%{Acct-Session-Time}:-0}), TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), NULLIF('%{Acct-Session-Time}', '')::bigint, '%{Acct-Authentic}', '%{Connect-Info}', NULL, (('%{%{Acct-Input-Gigawords}:-0}'::bigint << 32) + '%{%{Acct-Input-Octets}:-0}'::bigint), (('%{%{Acct-Output-Gigawords}:-0}'::bigint << 32) + '%{%{Acct-Output-Octets}:-0}'::bigint), '%{Called-Station-Id}', '%{Calling-Station-Id}', '%{Acct-Terminate-Cause}', '%{Service-Type}', '%{Framed-Protocol}', NULLIF('%{Framed-IP-Address}', '')::inet, NULLIF('%{Framed-IPv6-Address}', '')::inet, NULLIF('%{Framed-IPv6-Prefix}', '')::inet, NULLIF('%{Framed-Interface-Id}', ''), NULLIF('%{Delegated-IPv6-Prefix}', '')::inet ) ON CONFLICT (AcctUniqueId) DO NOTHING
(7) sql:    --> INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = 'thepumper' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '10.0.0.1' LIMIT 1) ), '80100014', 'baf56d545295c3594bcd0e562847bcf2', 'thepumper', NULLIF('', ''), '10.0.0.1', NULLIF('vlan888-hotspot', ''), 'Wireless-802.11', TO_TIMESTAMP(1782754387 - 5), TO_TIMESTAMP(1782754387), TO_TIMESTAMP(1782754387), NULLIF('5', '')::bigint, '', '', NULL, (('0'::bigint << 32) + '56'::bigint), (('0'::bigint << 32) + '56'::bigint), 'hs-vlan888-hotspot', 'BC:24:11:EB:56:4D', 'User-Request', '', '', NULLIF('10.5.88.2', '')::inet, NULLIF('', '')::inet, NULLIF('', '')::inet, NULLIF('', ''), NULLIF('', '')::inet ) ON CONFLICT (AcctUniqueId) DO NOTHING
(7) sql: Executing query: INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = 'thepumper' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '10.0.0.1' LIMIT 1) ), '80100014', 'baf56d545295c3594bcd0e562847bcf2', 'thepumper', NULLIF('', ''), '10.0.0.1', NULLIF('vlan888-hotspot', ''), 'Wireless-802.11', TO_TIMESTAMP(1782754387 - 5), TO_TIMESTAMP(1782754387), TO_TIMESTAMP(1782754387), NULLIF('5', '')::bigint, '', '', NULL, (('0'::bigint << 32) + '56'::bigint), (('0'::bigint << 32) + '56'::bigint), 'hs-vlan888-hotspot', 'BC:24:11:EB:56:4D', 'User-Request', '', '', NULLIF('10.5.88.2', '')::inet, NULLIF('', '')::inet, NULLIF('', '')::inet, NULLIF('', ''), NULLIF('', '')::inet ) ON CONFLICT (AcctUniqueId) DO NOTHING
rlm_sql_postgresql: Status: PGRES_FATAL_ERROR
rlm_sql_postgresql: 42P10: INVALID COLUMN REFERENCE
(7) sql: ERROR: rlm_sql_postgresql: ERROR:  there is no unique or exclusion constraint matching the ON CONFLICT specification
(7) sql: SQL query returned: server error
rlm_sql (sql): Released connection (6)
(7)     [sql] = fail
(7)   } # accounting = fail
(7) Not sending reply to client.
(7) Finished request
(7) Cleaning up request packet ID 46 with timestamp +24 due to done
Ready to process requests
(8) Received Accounting-Request Id 46 from 10.0.0.1:47149 to 10.0.0.105:1813 length 216
(8)   Acct-Status-Type = Stop
(8)   Acct-Terminate-Cause = User-Request
(8)   NAS-Port-Type = Wireless-802.11
(8)   Calling-Station-Id = "BC:24:11:EB:56:4D"
(8)   Called-Station-Id = "hs-vlan888-hotspot"
(8)   NAS-Port-Id = "vlan888-hotspot"
(8)   User-Name = "thepumper"
(8)   NAS-Port = 2148532244
(8)   Acct-Session-Id = "80100014"
(8)   Framed-IP-Address = 10.5.88.2
(8)   Mikrotik-Host-IP = 10.5.88.2
(8)   Event-Timestamp = "Jun 30 2026 00:33:07 +07"
(8)   Acct-Input-Octets = 56
(8)   Acct-Output-Octets = 56
(8)   Acct-Input-Gigawords = 0
(8)   Acct-Output-Gigawords = 0
(8)   Acct-Input-Packets = 1
(8)   Acct-Output-Packets = 1
(8)   Acct-Session-Time = 5
(8)   NAS-Identifier = "KhwanrichaiHome"
(8)   Acct-Delay-Time = 0
(8)   NAS-IP-Address = 10.0.0.1
(8) # Executing section preacct from file /etc/freeradius/3.0/sites-enabled/default
(8)   preacct {
(8)     [preprocess] = ok
(8)     policy acct_unique {
(8)       update request {
(8)         &Tmp-String-9 := "ai:"
(8)       } # update request = noop
(8)       if (("%{hex:&Class}" =~ /^%{hex:&Tmp-String-9}/) &&       ("%{string:&Class}" =~ /^ai:([0-9a-f]{32})/i)) {
(8)       EXPAND %{hex:&Class}
(8)          -->
(8)       EXPAND ^%{hex:&Tmp-String-9}
(8)          --> ^61693a
(8)       if (("%{hex:&Class}" =~ /^%{hex:&Tmp-String-9}/) &&       ("%{string:&Class}" =~ /^ai:([0-9a-f]{32})/i))  -> FALSE
(8)       else {
(8)         update request {
(8)           EXPAND %{md5:%{User-Name},%{Acct-Session-ID},%{%{NAS-IPv6-Address}:-%{NAS-IP-Address}},%{NAS-Identifier},%{NAS-Port-ID},%{NAS-Port}}
(8)              --> baf56d545295c3594bcd0e562847bcf2
(8)           &Acct-Unique-Session-Id := baf56d545295c3594bcd0e562847bcf2
(8)         } # update request = noop
(8)       } # else = noop
(8)       update request {
(8)         &Tmp-String-9 !* ANY
(8)       } # update request = noop
(8)     } # policy acct_unique = noop
(8) suffix: Checking for suffix after "@"
(8) suffix: No '@' in User-Name = "thepumper", looking up realm NULL
(8) suffix: No such realm "NULL"
(8)     [suffix] = noop
(8)     [files] = noop
(8)   } # preacct = ok
(8) # Executing section accounting from file /etc/freeradius/3.0/sites-enabled/default
(8)   accounting {
(8) detail: EXPAND /var/log/freeradius/radacct/%{%{Packet-Src-IP-Address}:-%{Packet-Src-IPv6-Address}}/detail-%Y%m%d
(8) detail:    --> /var/log/freeradius/radacct/10.0.0.1/detail-20260630
(8) detail: /var/log/freeradius/radacct/%{%{Packet-Src-IP-Address}:-%{Packet-Src-IPv6-Address}}/detail-%Y%m%d expands to /var/log/freeradius/radacct/10.0.0.1/detail-20260630
(8) detail: EXPAND %t
(8) detail:    --> Tue Jun 30 00:33:08 2026
(8)     [detail] = ok
(8)     [unix] = ok
(8) sql: EXPAND %{tolower:type.%{%{Acct-Status-Type}:-%{Request-Processing-Stage}}.query}
(8) sql:    --> type.stop.query
(8) sql: Using query template 'query'
rlm_sql (sql): Reserved connection (2)
(8) sql: EXPAND %{User-Name}
(8) sql:    --> thepumper
(8) sql: SQL-User-Name set to 'thepumper'
(8) sql: EXPAND UPDATE radacct SET AcctStopTime = TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), AcctUpdateTime = TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), AcctSessionTime = COALESCE(%{%{Acct-Session-Time}:-NULL}, (%{%{integer:Event-Timestamp}:-%l} - EXTRACT(EPOCH FROM(AcctStartTime)))), AcctInputOctets = (('%{%{Acct-Input-Gigawords}:-0}'::bigint << 32) + '%{%{Acct-Input-Octets}:-0}'::bigint), AcctOutputOctets = (('%{%{Acct-Output-Gigawords}:-0}'::bigint << 32) + '%{%{Acct-Output-Octets}:-0}'::bigint), AcctTerminateCause = '%{Acct-Terminate-Cause}', FramedIPAddress = NULLIF('%{Framed-IP-Address}', '')::inet, FramedIPv6Address = NULLIF('%{Framed-IPv6-Address}', '')::inet, FramedIPv6Prefix = NULLIF('%{Framed-IPv6-Prefix}', '')::inet, FramedInterfaceId = NULLIF('%{Framed-Interface-Id}', ''), DelegatedIPv6Prefix = NULLIF('%{Delegated-IPv6-Prefix}', '')::inet, ConnectInfo_stop = '%{Connect-Info}' WHERE AcctUniqueId = '%{Acct-Unique-Session-Id}' AND AcctStopTime IS NULL
(8) sql:    --> UPDATE radacct SET AcctStopTime = TO_TIMESTAMP(1782754387), AcctUpdateTime = TO_TIMESTAMP(1782754387), AcctSessionTime = COALESCE(5, (1782754387 - EXTRACT(EPOCH FROM(AcctStartTime)))), AcctInputOctets = (('0'::bigint << 32) + '56'::bigint), AcctOutputOctets = (('0'::bigint << 32) + '56'::bigint), AcctTerminateCause = 'User-Request', FramedIPAddress = NULLIF('10.5.88.2', '')::inet, FramedIPv6Address = NULLIF('', '')::inet, FramedIPv6Prefix = NULLIF('', '')::inet, FramedInterfaceId = NULLIF('', ''), DelegatedIPv6Prefix = NULLIF('', '')::inet, ConnectInfo_stop = '' WHERE AcctUniqueId = 'baf56d545295c3594bcd0e562847bcf2' AND AcctStopTime IS NULL
(8) sql: Executing query: UPDATE radacct SET AcctStopTime = TO_TIMESTAMP(1782754387), AcctUpdateTime = TO_TIMESTAMP(1782754387), AcctSessionTime = COALESCE(5, (1782754387 - EXTRACT(EPOCH FROM(AcctStartTime)))), AcctInputOctets = (('0'::bigint << 32) + '56'::bigint), AcctOutputOctets = (('0'::bigint << 32) + '56'::bigint), AcctTerminateCause = 'User-Request', FramedIPAddress = NULLIF('10.5.88.2', '')::inet, FramedIPv6Address = NULLIF('', '')::inet, FramedIPv6Prefix = NULLIF('', '')::inet, FramedInterfaceId = NULLIF('', ''), DelegatedIPv6Prefix = NULLIF('', '')::inet, ConnectInfo_stop = '' WHERE AcctUniqueId = 'baf56d545295c3594bcd0e562847bcf2' AND AcctStopTime IS NULL
rlm_sql_postgresql: Status: PGRES_COMMAND_OK
rlm_sql_postgresql: query affected rows = 0
(8) sql: SQL query returned: success
(8) sql: 0 record(s) updated
(8) sql: Trying next query...
(8) sql: EXPAND INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = '%{SQL-User-Name}' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '%{NAS-IP-Address}' LIMIT 1) ), '%{Acct-Session-Id}', '%{Acct-Unique-Session-Id}', '%{SQL-User-Name}', NULLIF('%{Realm}', ''), '%{%{NAS-IPv6-Address}:-%{NAS-IP-Address}}', NULLIF('%{%{NAS-Port-ID}:-%{NAS-Port}}', ''), '%{NAS-Port-Type}', TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l} - %{%{Acct-Session-Time}:-0}), TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), NULLIF('%{Acct-Session-Time}', '')::bigint, '%{Acct-Authentic}', '%{Connect-Info}', NULL, (('%{%{Acct-Input-Gigawords}:-0}'::bigint << 32) + '%{%{Acct-Input-Octets}:-0}'::bigint), (('%{%{Acct-Output-Gigawords}:-0}'::bigint << 32) + '%{%{Acct-Output-Octets}:-0}'::bigint), '%{Called-Station-Id}', '%{Calling-Station-Id}', '%{Acct-Terminate-Cause}', '%{Service-Type}', '%{Framed-Protocol}', NULLIF('%{Framed-IP-Address}', '')::inet, NULLIF('%{Framed-IPv6-Address}', '')::inet, NULLIF('%{Framed-IPv6-Prefix}', '')::inet, NULLIF('%{Framed-Interface-Id}', ''), NULLIF('%{Delegated-IPv6-Prefix}', '')::inet ) ON CONFLICT (AcctUniqueId) DO NOTHING
(8) sql:    --> INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = 'thepumper' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '10.0.0.1' LIMIT 1) ), '80100014', 'baf56d545295c3594bcd0e562847bcf2', 'thepumper', NULLIF('', ''), '10.0.0.1', NULLIF('vlan888-hotspot', ''), 'Wireless-802.11', TO_TIMESTAMP(1782754387 - 5), TO_TIMESTAMP(1782754387), TO_TIMESTAMP(1782754387), NULLIF('5', '')::bigint, '', '', NULL, (('0'::bigint << 32) + '56'::bigint), (('0'::bigint << 32) + '56'::bigint), 'hs-vlan888-hotspot', 'BC:24:11:EB:56:4D', 'User-Request', '', '', NULLIF('10.5.88.2', '')::inet, NULLIF('', '')::inet, NULLIF('', '')::inet, NULLIF('', ''), NULLIF('', '')::inet ) ON CONFLICT (AcctUniqueId) DO NOTHING
(8) sql: Executing query: INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = 'thepumper' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '10.0.0.1' LIMIT 1) ), '80100014', 'baf56d545295c3594bcd0e562847bcf2', 'thepumper', NULLIF('', ''), '10.0.0.1', NULLIF('vlan888-hotspot', ''), 'Wireless-802.11', TO_TIMESTAMP(1782754387 - 5), TO_TIMESTAMP(1782754387), TO_TIMESTAMP(1782754387), NULLIF('5', '')::bigint, '', '', NULL, (('0'::bigint << 32) + '56'::bigint), (('0'::bigint << 32) + '56'::bigint), 'hs-vlan888-hotspot', 'BC:24:11:EB:56:4D', 'User-Request', '', '', NULLIF('10.5.88.2', '')::inet, NULLIF('', '')::inet, NULLIF('', '')::inet, NULLIF('', ''), NULLIF('', '')::inet ) ON CONFLICT (AcctUniqueId) DO NOTHING
rlm_sql_postgresql: Status: PGRES_FATAL_ERROR
rlm_sql_postgresql: 42P10: INVALID COLUMN REFERENCE
(8) sql: ERROR: rlm_sql_postgresql: ERROR:  there is no unique or exclusion constraint matching the ON CONFLICT specification
(8) sql: SQL query returned: server error
rlm_sql (sql): Released connection (2)
(8)     [sql] = fail
(8)   } # accounting = fail
(8) Not sending reply to client.
(8) Finished request
(8) Cleaning up request packet ID 46 with timestamp +25 due to done
Ready to process requests
(9) Received Accounting-Request Id 46 from 10.0.0.1:47149 to 10.0.0.105:1813 length 216
(9)   Acct-Status-Type = Stop
(9)   Acct-Terminate-Cause = User-Request
(9)   NAS-Port-Type = Wireless-802.11
(9)   Calling-Station-Id = "BC:24:11:EB:56:4D"
(9)   Called-Station-Id = "hs-vlan888-hotspot"
(9)   NAS-Port-Id = "vlan888-hotspot"
(9)   User-Name = "thepumper"
(9)   NAS-Port = 2148532244
(9)   Acct-Session-Id = "80100014"
(9)   Framed-IP-Address = 10.5.88.2
(9)   Mikrotik-Host-IP = 10.5.88.2
(9)   Event-Timestamp = "Jun 30 2026 00:33:07 +07"
(9)   Acct-Input-Octets = 56
(9)   Acct-Output-Octets = 56
(9)   Acct-Input-Gigawords = 0
(9)   Acct-Output-Gigawords = 0
(9)   Acct-Input-Packets = 1
(9)   Acct-Output-Packets = 1
(9)   Acct-Session-Time = 5
(9)   NAS-Identifier = "KhwanrichaiHome"
(9)   Acct-Delay-Time = 0
(9)   NAS-IP-Address = 10.0.0.1
(9) # Executing section preacct from file /etc/freeradius/3.0/sites-enabled/default
(9)   preacct {
(9)     [preprocess] = ok
(9)     policy acct_unique {
(9)       update request {
(9)         &Tmp-String-9 := "ai:"
(9)       } # update request = noop
(9)       if (("%{hex:&Class}" =~ /^%{hex:&Tmp-String-9}/) &&       ("%{string:&Class}" =~ /^ai:([0-9a-f]{32})/i)) {
(9)       EXPAND %{hex:&Class}
(9)          -->
(9)       EXPAND ^%{hex:&Tmp-String-9}
(9)          --> ^61693a
(9)       if (("%{hex:&Class}" =~ /^%{hex:&Tmp-String-9}/) &&       ("%{string:&Class}" =~ /^ai:([0-9a-f]{32})/i))  -> FALSE
(9)       else {
(9)         update request {
(9)           EXPAND %{md5:%{User-Name},%{Acct-Session-ID},%{%{NAS-IPv6-Address}:-%{NAS-IP-Address}},%{NAS-Identifier},%{NAS-Port-ID},%{NAS-Port}}
(9)              --> baf56d545295c3594bcd0e562847bcf2
(9)           &Acct-Unique-Session-Id := baf56d545295c3594bcd0e562847bcf2
(9)         } # update request = noop
(9)       } # else = noop
(9)       update request {
(9)         &Tmp-String-9 !* ANY
(9)       } # update request = noop
(9)     } # policy acct_unique = noop
(9) suffix: Checking for suffix after "@"
(9) suffix: No '@' in User-Name = "thepumper", looking up realm NULL
(9) suffix: No such realm "NULL"
(9)     [suffix] = noop
(9)     [files] = noop
(9)   } # preacct = ok
(9) # Executing section accounting from file /etc/freeradius/3.0/sites-enabled/default
(9)   accounting {
(9) detail: EXPAND /var/log/freeradius/radacct/%{%{Packet-Src-IP-Address}:-%{Packet-Src-IPv6-Address}}/detail-%Y%m%d
(9) detail:    --> /var/log/freeradius/radacct/10.0.0.1/detail-20260630
(9) detail: /var/log/freeradius/radacct/%{%{Packet-Src-IP-Address}:-%{Packet-Src-IPv6-Address}}/detail-%Y%m%d expands to /var/log/freeradius/radacct/10.0.0.1/detail-20260630
(9) detail: EXPAND %t
(9) detail:    --> Tue Jun 30 00:33:09 2026
(9)     [detail] = ok
(9)     [unix] = ok
(9) sql: EXPAND %{tolower:type.%{%{Acct-Status-Type}:-%{Request-Processing-Stage}}.query}
(9) sql:    --> type.stop.query
(9) sql: Using query template 'query'
rlm_sql (sql): Reserved connection (7)
(9) sql: EXPAND %{User-Name}
(9) sql:    --> thepumper
(9) sql: SQL-User-Name set to 'thepumper'
(9) sql: EXPAND UPDATE radacct SET AcctStopTime = TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), AcctUpdateTime = TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), AcctSessionTime = COALESCE(%{%{Acct-Session-Time}:-NULL}, (%{%{integer:Event-Timestamp}:-%l} - EXTRACT(EPOCH FROM(AcctStartTime)))), AcctInputOctets = (('%{%{Acct-Input-Gigawords}:-0}'::bigint << 32) + '%{%{Acct-Input-Octets}:-0}'::bigint), AcctOutputOctets = (('%{%{Acct-Output-Gigawords}:-0}'::bigint << 32) + '%{%{Acct-Output-Octets}:-0}'::bigint), AcctTerminateCause = '%{Acct-Terminate-Cause}', FramedIPAddress = NULLIF('%{Framed-IP-Address}', '')::inet, FramedIPv6Address = NULLIF('%{Framed-IPv6-Address}', '')::inet, FramedIPv6Prefix = NULLIF('%{Framed-IPv6-Prefix}', '')::inet, FramedInterfaceId = NULLIF('%{Framed-Interface-Id}', ''), DelegatedIPv6Prefix = NULLIF('%{Delegated-IPv6-Prefix}', '')::inet, ConnectInfo_stop = '%{Connect-Info}' WHERE AcctUniqueId = '%{Acct-Unique-Session-Id}' AND AcctStopTime IS NULL
(9) sql:    --> UPDATE radacct SET AcctStopTime = TO_TIMESTAMP(1782754387), AcctUpdateTime = TO_TIMESTAMP(1782754387), AcctSessionTime = COALESCE(5, (1782754387 - EXTRACT(EPOCH FROM(AcctStartTime)))), AcctInputOctets = (('0'::bigint << 32) + '56'::bigint), AcctOutputOctets = (('0'::bigint << 32) + '56'::bigint), AcctTerminateCause = 'User-Request', FramedIPAddress = NULLIF('10.5.88.2', '')::inet, FramedIPv6Address = NULLIF('', '')::inet, FramedIPv6Prefix = NULLIF('', '')::inet, FramedInterfaceId = NULLIF('', ''), DelegatedIPv6Prefix = NULLIF('', '')::inet, ConnectInfo_stop = '' WHERE AcctUniqueId = 'baf56d545295c3594bcd0e562847bcf2' AND AcctStopTime IS NULL
(9) sql: Executing query: UPDATE radacct SET AcctStopTime = TO_TIMESTAMP(1782754387), AcctUpdateTime = TO_TIMESTAMP(1782754387), AcctSessionTime = COALESCE(5, (1782754387 - EXTRACT(EPOCH FROM(AcctStartTime)))), AcctInputOctets = (('0'::bigint << 32) + '56'::bigint), AcctOutputOctets = (('0'::bigint << 32) + '56'::bigint), AcctTerminateCause = 'User-Request', FramedIPAddress = NULLIF('10.5.88.2', '')::inet, FramedIPv6Address = NULLIF('', '')::inet, FramedIPv6Prefix = NULLIF('', '')::inet, FramedInterfaceId = NULLIF('', ''), DelegatedIPv6Prefix = NULLIF('', '')::inet, ConnectInfo_stop = '' WHERE AcctUniqueId = 'baf56d545295c3594bcd0e562847bcf2' AND AcctStopTime IS NULL
rlm_sql_postgresql: Status: PGRES_COMMAND_OK
rlm_sql_postgresql: query affected rows = 0
(9) sql: SQL query returned: success
(9) sql: 0 record(s) updated
(9) sql: Trying next query...
(9) sql: EXPAND INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = '%{SQL-User-Name}' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '%{NAS-IP-Address}' LIMIT 1) ), '%{Acct-Session-Id}', '%{Acct-Unique-Session-Id}', '%{SQL-User-Name}', NULLIF('%{Realm}', ''), '%{%{NAS-IPv6-Address}:-%{NAS-IP-Address}}', NULLIF('%{%{NAS-Port-ID}:-%{NAS-Port}}', ''), '%{NAS-Port-Type}', TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l} - %{%{Acct-Session-Time}:-0}), TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), TO_TIMESTAMP(%{%{integer:Event-Timestamp}:-%l}), NULLIF('%{Acct-Session-Time}', '')::bigint, '%{Acct-Authentic}', '%{Connect-Info}', NULL, (('%{%{Acct-Input-Gigawords}:-0}'::bigint << 32) + '%{%{Acct-Input-Octets}:-0}'::bigint), (('%{%{Acct-Output-Gigawords}:-0}'::bigint << 32) + '%{%{Acct-Output-Octets}:-0}'::bigint), '%{Called-Station-Id}', '%{Calling-Station-Id}', '%{Acct-Terminate-Cause}', '%{Service-Type}', '%{Framed-Protocol}', NULLIF('%{Framed-IP-Address}', '')::inet, NULLIF('%{Framed-IPv6-Address}', '')::inet, NULLIF('%{Framed-IPv6-Prefix}', '')::inet, NULLIF('%{Framed-Interface-Id}', ''), NULLIF('%{Delegated-IPv6-Prefix}', '')::inet ) ON CONFLICT (AcctUniqueId) DO NOTHING
(9) sql:    --> INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = 'thepumper' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '10.0.0.1' LIMIT 1) ), '80100014', 'baf56d545295c3594bcd0e562847bcf2', 'thepumper', NULLIF('', ''), '10.0.0.1', NULLIF('vlan888-hotspot', ''), 'Wireless-802.11', TO_TIMESTAMP(1782754387 - 5), TO_TIMESTAMP(1782754387), TO_TIMESTAMP(1782754387), NULLIF('5', '')::bigint, '', '', NULL, (('0'::bigint << 32) + '56'::bigint), (('0'::bigint << 32) + '56'::bigint), 'hs-vlan888-hotspot', 'BC:24:11:EB:56:4D', 'User-Request', '', '', NULLIF('10.5.88.2', '')::inet, NULLIF('', '')::inet, NULLIF('', '')::inet, NULLIF('', ''), NULLIF('', '')::inet ) ON CONFLICT (AcctUniqueId) DO NOTHING
(9) sql: Executing query: INSERT INTO radacct (tenant_id, AcctSessionId, AcctUniqueId, UserName, Realm, NASIPAddress, NASPortId, NASPortType, AcctStartTime, AcctUpdateTime, AcctStopTime, AcctSessionTime, AcctAuthentic, ConnectInfo_start, ConnectInfo_Stop, AcctInputOctets, AcctOutputOctets, CalledStationId, CallingStationId, AcctTerminateCause, ServiceType, FramedProtocol, FramedIpAddress, FramedIpv6Address, FramedIpv6Prefix, FramedInterfaceId, DelegatedIpv6Prefix ) VALUES(COALESCE( (SELECT tenant_id FROM radcheck WHERE username = 'thepumper' LIMIT 1), (SELECT tenant_id FROM nas WHERE nasname = '10.0.0.1' LIMIT 1) ), '80100014', 'baf56d545295c3594bcd0e562847bcf2', 'thepumper', NULLIF('', ''), '10.0.0.1', NULLIF('vlan888-hotspot', ''), 'Wireless-802.11', TO_TIMESTAMP(1782754387 - 5), TO_TIMESTAMP(1782754387), TO_TIMESTAMP(1782754387), NULLIF('5', '')::bigint, '', '', NULL, (('0'::bigint << 32) + '56'::bigint), (('0'::bigint << 32) + '56'::bigint), 'hs-vlan888-hotspot', 'BC:24:11:EB:56:4D', 'User-Request', '', '', NULLIF('10.5.88.2', '')::inet, NULLIF('', '')::inet, NULLIF('', '')::inet, NULLIF('', ''), NULLIF('', '')::inet ) ON CONFLICT (AcctUniqueId) DO NOTHING
rlm_sql_postgresql: Status: PGRES_FATAL_ERROR
rlm_sql_postgresql: 42P10: INVALID COLUMN REFERENCE
(9) sql: ERROR: rlm_sql_postgresql: ERROR:  there is no unique or exclusion constraint matching the ON CONFLICT specification
(9) sql: SQL query returned: server error
rlm_sql (sql): Released connection (7)
(9)     [sql] = fail
(9)   } # accounting = fail
(9) Not sending reply to client.
(9) Finished request
(9) Cleaning up request packet ID 46 with timestamp +26 due to done
