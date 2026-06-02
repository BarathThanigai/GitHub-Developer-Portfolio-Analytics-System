-- Run this first on a fresh local MySQL instance.
-- Then run database/sample_data.sql

CREATE DATABASE IF NOT EXISTS `DBMS_PROJECT`;
USE `DBMS_PROJECT`;

CREATE TABLE IF NOT EXISTS `user` (
  `user_id` BIGINT NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT NULL,
  `followers_count` INT DEFAULT 0,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_user_email` (`email`),
  UNIQUE KEY `uq_user_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `repository` (
  `repo_id` BIGINT NOT NULL,
  `repo_name` VARCHAR(255) NOT NULL,
  `visibility` ENUM('public', 'private') NOT NULL DEFAULT 'private',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` BIGINT NOT NULL,
  `parent_repo_id` BIGINT DEFAULT NULL,
  PRIMARY KEY (`repo_id`),
  KEY `idx_repository_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `commit_table` (
  `commit_id` VARCHAR(100) NOT NULL,
  `commit_message` TEXT NOT NULL,
  `commit_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lines_added` INT DEFAULT 0,
  `lines_deleted` INT DEFAULT 0,
  `repo_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  PRIMARY KEY (`commit_id`),
  KEY `idx_commit_repo_id` (`repo_id`),
  KEY `idx_commit_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `programming_language` (
  `language_id` INT NOT NULL,
  `language_name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`language_id`),
  UNIQUE KEY `uq_programming_language_name` (`language_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `repository_language` (
  `repo_id` BIGINT NOT NULL,
  `language_id` INT NOT NULL,
  `usage_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`repo_id`, `language_id`),
  KEY `idx_repo_lang_language_id` (`language_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `issue` (
  `issue_id` BIGINT NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `status` ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `repo_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  PRIMARY KEY (`issue_id`),
  KEY `idx_issue_repo_id` (`repo_id`),
  KEY `idx_issue_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pull_request` (
  `pr_id` BIGINT NOT NULL,
  `status` ENUM('open', 'closed', 'merged') NOT NULL DEFAULT 'open',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `merged_at` DATETIME DEFAULT NULL,
  `closed_at` DATETIME DEFAULT NULL,
  `repo_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  PRIMARY KEY (`pr_id`),
  KEY `idx_pr_repo_id` (`repo_id`),
  KEY `idx_pr_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `repository_stat` (
  `repo_id` BIGINT NOT NULL,
  `stars_count` INT DEFAULT 0,
  `forks_count` INT DEFAULT 0,
  `recorded_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`repo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `collaborator` (
  `user_id` BIGINT NOT NULL,
  `repo_id` BIGINT NOT NULL,
  `lines_added` INT DEFAULT 0,
  `lines_deleted` INT DEFAULT 0,
  PRIMARY KEY (`user_id`, `repo_id`),
  KEY `idx_collaborator_repo_id` (`repo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Missing base users referenced by sample_data.sql
INSERT IGNORE INTO `user` (`user_id`, `username`, `email`, `state`, `country`, `followers_count`) VALUES
  (174858312, 'BarathThanigai', 'baraththanigai@example.com', 'Tamil Nadu', 'India', 20),
  (212506208, 'Thasshien', 'thasshien@example.com', 'Tamil Nadu', 'India', 18),
  (178605487, 'Karnaveer10', 'karnaveer10@example.com', 'Punjab', 'India', 15),
  (200494277, 'amitesh013', 'amitesh013@example.com', 'Delhi', 'India', 22),
  (178005446, 'Vishwa-Thangapandian', 'vishwa.thangapandian@example.com', 'Tamil Nadu', 'India', 19);

-- Language IDs used by sample_data.sql
INSERT IGNORE INTO `programming_language` (`language_id`, `language_name`) VALUES
  (1, 'JavaScript'),
  (2, 'Python'),
  (3, 'Java'),
  (4, 'C'),
  (5, 'SQL'),
  (6, 'HTML'),
  (7, 'C++'),
  (8, 'C#'),
  (9, 'TypeScript'),
  (10, 'Go'),
  (11, 'Rust'),
  (12, 'Kotlin'),
  (13, 'Swift'),
  (14, 'PHP'),
  (15, 'Ruby'),
  (16, 'Dart'),
  (17, 'Shell'),
  (18, 'Scala'),
  (19, 'R'),
  (20, 'MATLAB');
