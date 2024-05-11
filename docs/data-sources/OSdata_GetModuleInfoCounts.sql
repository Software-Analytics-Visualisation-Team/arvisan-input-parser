/* GetAppInfoCounts */ 

WITH wScreen AS 
(SELECT  
Espace_Id 
, COUNT(Espace_Id) AS scrCount 
FROM OSSYS_ESPACE_SCREEN 
GROUP BY Espace_Id), 
 
wEntity AS 
(SELECT  
 [OS_DBname].dbo.[OSSYS_ENTITY].[ESPACE_ID] 
, COUNT( [OS_DBname].dbo.[OSSYS_ENTITY].[ESPACE_ID]) AS entCount 
FROM  [OS_DBname].dbo.[OSSYS_ENTITY] 
WHERE  [OS_DBname].dbo.[OSSYS_ENTITY].[IS_ACTIVE] = 1 
GROUP BY  [OS_DBname].dbo.[OSSYS_ENTITY].[ESPACE_ID]), 
 
wPublicElement AS 
(SELECT  
Published_Prod_Version_Id 
, COUNT(Published_Prod_Version_Id) AS peCount 
FROM OSSYS_MODULE_PUBLICELEMENT 
GROUP BY Published_Prod_Version_Id), 
 
wRestCons AS 
(SELECT  
Espace_Id 
, COUNT(Espace_Id) AS restrefCount 
FROM OSSYS_REST_WEB_REFERENCE 
WHERE Is_Active = 1 
GROUP BY Espace_Id), 
 
wRestExpose AS 
(SELECT  
Espace_Id 
, COUNT(Espace_Id) AS restexpCount 
FROM OSSYS_REST_EXPOSE 
WHERE Is_Active = 1 
GROUP BY Espace_Id), 
 
wBPTDef AS 
(SELECT  
 [OS_DBname].dbo.[OSSYS_BPM_PROCESS_DEFINITION].[ESPACE_ID] 
, COUNT( [OS_DBname].dbo.[OSSYS_BPM_PROCESS_DEFINITION].[ESPACE_ID]) AS bptDefCount 
FROM  [OS_DBname].dbo.[OSSYS_BPM_PROCESS_DEFINITION] 
WHERE  [OS_DBname].dbo.[OSSYS_BPM_PROCESS_DEFINITION].[IS_ACTIVE] = 1 
GROUP BY Espace_Id) 
 
SELECT  
 [OS_DBname].dbo.[OSSYS_APPLICATION].[ID] as ApplicationId 
,  [OS_DBname].dbo.[OSSYS_APPLICATION].[NAME] as ApplicationName 
,  [OS_DBname].dbo.[OSSYS_APPLICATION].[KEY] as ApplicationSSKey 
,  [OS_DBname].dbo.[OSSYS_ESPACE].[ID] as ModuleId 
,  [OS_DBname].dbo.[OSSYS_ESPACE].[NAME] as ModuleName 
,  [OS_DBname].dbo.[OSSYS_ESPACE].[SS_KEY] as ModuleSSKey 
, MAX(DATALENGTH( [OS_DBname].dbo.[OSSYS_ESPACE_VERSION].[OML_FILE])/1024) as FileSizeKB 
, MAX(scrCount) as Count_Screens 
, MAX(entCount) as Count_Entities 
, MAX(peCount) as Count_PublicElements 
, MAX(restrefCount) as Count_REST_Consumer 
, MAX(restexpCount) as Count_REST_Producer 
, MAX(bptDefCount) as Count_BPTProcessDef 
FROM  [OS_DBname].dbo.[OSSYS_ESPACE] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_MODULE] on  [OS_DBname].dbo.[OSSYS_MODULE].[ESPACE_ID] =  [OS_DBname].dbo.[OSSYS_ESPACE].[ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_APP_DEFINITION_MODULE] on  [OS_DBname].dbo.[OSSYS_APP_DEFINITION_MODULE].[MODULE_ID] =  [OS_DBname].dbo.[OSSYS_MODULE].[ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_APPLICATION] on  [OS_DBname].dbo.[OSSYS_APP_DEFINITION_MODULE].[APPLICATION_ID] =  [OS_DBname].dbo.[OSSYS_APPLICATION].[ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_ESPACE_VERSION] on  [OS_DBname].dbo.[OSSYS_ESPACE].[VERSION_ID] =  [OS_DBname].dbo.[OSSYS_ESPACE_VERSION].[ID] 
LEFT JOIN wScreen ON wScreen.Espace_Id =  [OS_DBname].dbo.[OSSYS_ESPACE].[ID] 
LEFT JOIN wEntity ON wEntity.Espace_Id =  [OS_DBname].dbo.[OSSYS_ESPACE_VERSION].[ESPACE_ID] 
LEFT JOIN wPublicElement on wPublicElement.PUBLISHED_PROD_VERSION_ID =  [OS_DBname].dbo.[OSSYS_ESPACE_VERSION].[ID] 
LEFT JOIN wRestCons on wRestCons.Espace_Id =  [OS_DBname].dbo.[OSSYS_ESPACE_VERSION].[ESPACE_ID] 
LEFT JOIN wRestExpose on wRestExpose.Espace_Id =  [OS_DBname].dbo.[OSSYS_ESPACE_VERSION].[ESPACE_ID] 
LEFT JOIN wBPTDef on wBPTDef.Espace_Id =  [OS_DBname].dbo.[OSSYS_ESPACE_VERSION].[ESPACE_ID] 
 
GROUP BY 
 [OS_DBname].dbo.[OSSYS_APPLICATION].[ID] 
,  [OS_DBname].dbo.[OSSYS_APPLICATION].[NAME] 
,  [OS_DBname].dbo.[OSSYS_APPLICATION].[KEY] 
,  [OS_DBname].dbo.[OSSYS_ESPACE].[ID] 
,  [OS_DBname].dbo.[OSSYS_ESPACE].[NAME] 
,  [OS_DBname].dbo.[OSSYS_ESPACE].[SS_KEY] 
 
ORDER BY 
 [OS_DBname].dbo.[OSSYS_APPLICATION].[NAME] 
,  [OS_DBname].dbo.[OSSYS_ESPACE].[NAME]