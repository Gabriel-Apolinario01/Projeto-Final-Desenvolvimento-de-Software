CREATE DATABABASE Geral;
USE Geral;

CREATE TABLE usuario (
id_usuario INT NOT NULL AUTO_INCREMENT,
nome VARCHAR(100) NOT NULL,
email VARCHAR(100) NOT NULL,
senha VARCHAR(64) NOT NULL,
data_cadastro DATETIME NOT NULL,
CONSTRAINT USUARIO_PK PRIMARY KEY (id_usuario),
CONSTRAINT EMAIL_UNIQUE UNIQUE (email)
);


CREATE TABLE trilha_personalizada (
id_personalizada INT NOT NULL AUTO_INCREMENT,
id_usuario INT NOT NULL,
nome_trilha VARCHAR(100) NOT NULL,
descricao_trilha TEXT NOT NULL,
CONSTRAINT PERSONALIZADA_PK PRIMARY KEY (id_personalizada),
CONSTRAINT FK_USUARIO FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);


CREATE TABLE trilha_estudo (
id_trilha INT NOT NULL AUTO_INCREMENT,
nome_trilha VARCHAR(100) NOT NULL,
descricao_trilha TEXT NOT NULL,
tipo VARCHAR(20) NOT NULL,
CONSTRAINT TRILHA_PK PRIMARY KEY (id_trilha)
);


CREATE TABLE atividade (
id_atividade INT NOT NULL AUTO_INCREMENT,
id_personalizada INT NOT NULL,
id_trilha INT NOT NULL,
nome_atividade VARCHAR(100) NOT NULL,
descricao_atividade TEXT NOT NULL,
data_limite DATETIME NOT NULL,
CONSTRAINT ATIVIDADE_PK PRIMARY KEY (id_atividade),
CONSTRAINT FK_TRILHA FOREIGN KEY (id_personalizada) REFERENCES trilha_personalizada(id_personalizada),
CONSTRAINT FK_TRILHA_ESTUDO FOREIGN KEY (id_trilha) REFERENCES trilha_estudo(id_trilha)
);


CREATE TABLE progresso (
id_progresso INT NOT NULL AUTO_INCREMENT,
id_usuario INT NOT NULL,
id_trilha INT NOT NULL,
percentual_conclusao DECIMAL(5,2) NOT NULL,
CONSTRAINT PROGRESSO_PK PRIMARY KEY (id_progresso),
CONSTRAINT FK_USUARIO FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
CONSTRAINT FK_TRILHA FOREIGN KEY (id_trilha) REFERENCES trilha_estudo(id_trilha)
);


CREATE TABLE feedback (
id_feedback INT NOT NULL AUTO_INCREMENT,
id_usuario INT NOT NULL,
id_atividade INT NOT NULL,
comentario TEXT NOT NULL,
data_feedback DATETIME NOT NULL,
CONSTRAINT FEEDBACK_PK PRIMARY KEY (id_feedback),
CONSTRAINT FK_USUARIO FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
CONSTRAINT FK_ATIVIDADE FOREIGN KEY (id_atividade) REFERENCES atividade(id_atividade)
);


CREATE TABLE conteudo (
id_conteudo INT NOT NULL AUTO_INCREMENT,
id_trilha INT NOT NULL,
titulo VARCHAR(100) NOT NULL,
tipo VARCHAR(50) NOT NULL,
duracao INT NOT NULL,
CONSTRAINT CONTEUDO_PK PRIMARY KEY (id_conteudo),
CONSTRAINT FK_TRILHA FOREIGN KEY (id_trilha) REFERENCES trilha_estudo(id_trilha)
);
