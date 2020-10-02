SELECT Avg(cnt) AS days 
FROM   (SELECT Count(*) AS cnt 
        FROM   ? 
        WHERE  mean_temp_f BETWEEN 55.0 AND 75.0 
               AND max_temp_f BETWEEN 60.0 AND 90.0 
               AND min_temp_f BETWEEN 40.0 AND 70.0 
               AND precip_in = 0.0 
        GROUP  BY Year(day))