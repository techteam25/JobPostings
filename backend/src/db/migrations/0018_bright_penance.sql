ALTER TABLE `job_alerts` ADD CONSTRAINT `job_alerts_check_search_query_or_filters` CHECK ((
            JSON_LENGTH(`job_alerts`.`job_type`) > 0 OR
            JSON_LENGTH(`job_alerts`.`skills`) > 0 OR
            JSON_LENGTH(`job_alerts`.`experience_level`) > 0 OR
            `job_alerts`.`city` IS NOT NULL OR
            `job_alerts`.`state` IS NOT NULL OR
            (`job_alerts`.`search_query` IS NOT NULL AND CHAR_LENGTH(TRIM(`job_alerts`.`search_query`)) > 0)
          ));