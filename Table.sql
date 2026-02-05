create table client (id int primary key auto_increment,name tinytext,description varchar(500),client_id tinytext, client_secret tinytext,is_trashed boolean);

create table project(project_id int primary key auto_increment,name tinytext,description varchar(500),scopes varchar(1000),auto_regeneration boolean,is_trashed boolean,client_id int,foreign key (client_id) references client(id) on delete cascade on update cascade);

create table token(token_id int primary key auto_increment,access_token tinytext,refresh_token tinytext, created_time varchar(20),project_id int,foreign key(project_id) references project(project_id) on delete cascade on update cascade);

create table client_trash( trash_id int primary key auto_increment, deleted_date date,reason varchar(500), client_id int,foreign key(client_id) references client(id) on delete cascade on update cascade);

create table project_trash(trash_id int primary key auto_increment,deleted_date date, reason varchar(500),project_id int, foreign key(project_id) references project(project_id) on delete cascade on update cascade);

create table log (log_id int primary key auto_increment, action tinytext, time timestamp, client_id int,project_id int, foreign key (client_id) references client(id) on delete cascade on update cascade, foreign key (project_id) references project(project_id) on delete cascade on update cascade);
