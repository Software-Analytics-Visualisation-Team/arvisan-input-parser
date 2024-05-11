/* GetConsumers */ 

SELECT  
applCons.Name as Cons_Application 
, applCons.[KEY] as Cons_ApplSSKey 
, espCons.Name as Cons_Module 
, espCons.SS_Key as Cons_EspaceSSKey 
, applProd.Name as Prod_Application 
, applProd.[KEY] as Prod_ApplSSKey 
, rfx.Producer_Name as Prod_Module 
, 'Espace' as Prod_ModuleKind 
, rfx.Name as Reference_Name 
, rfx.Kind as Reference_Kind 
, rfx.SS_Key as Reference_SSKey 
FROM OSSYS_ESPACE_REFERENCE rfx 
INNER JOIN  [OS_DBname].dbo.[OSSYS_ESPACE] espCons on rfx.Consumer_Version_Id = espCons.[VERSION_ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_ESPACE_VERSION] espProdVer on rfx.Published_Prod_Version_Id = espProdVer.[ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_MODULE] mdlCons on espCons.[ID] = mdlCons.[ESPACE_ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_APP_DEFINITION_MODULE] admCons on mdlCons.[ID] = admCons.[MODULE_ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_APPLICATION] applCons on applCons.[ID] = admCons.[APPLICATION_ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_MODULE] mdlProd on espProdVer.[ESPACE_ID] = mdlProd.[ESPACE_ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_APP_DEFINITION_MODULE] admProd on mdlProd.[ID] = admProd.[MODULE_ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_APPLICATION] applProd on applProd.[ID] = admProd.[APPLICATION_ID] 
 
WHERE (applProd.[ID] = @ProducerApplicationId 
OR @ProducerApplicationId = '') 
AND espCons.Is_Active = 1 
 
UNION 
 
SELECT  
applCons.Name as Cons_Application 
, applCons.[KEY] as Cons_ApplSSKey 
, espCons.Name as Cons_Module 
, espCons.SS_Key as Cons_EspaceSSKey 
, applProd.Name as Prod_Application 
, applProd.[KEY] as Prod_ApplSSKey 
, rfx.Producer_Name as Prod_Module 
, 'Espace' as ModuleKind 
, rfx.Name as Reference_Name 
, rfx.Kind as Reference_Kind 
, rfx.SS_Key as Reference_SSKey 
FROM OSSYS_ESPACE_REFERENCE rfx 
INNER JOIN  [OS_DBname].dbo.[OSSYS_EXTENSION] espCons on rfx.Consumer_Version_Id = espCons.[VERSION_ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_EXTENSION_VERSION] espProdVer on rfx.Published_Prod_Version_Id = espProdVer.[ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_MODULE] mdlCons on espCons.[ID] = mdlCons.[EXTENSION_ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_APP_DEFINITION_MODULE] admCons on mdlCons.[ID] = admCons.[MODULE_ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_APPLICATION] applCons on applCons.[ID] = admCons.[APPLICATION_ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_MODULE] mdlProd on espProdVer.[EXTENSION_ID] = mdlProd.[EXTENSION_ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_APP_DEFINITION_MODULE] admProd on mdlProd.[ID] = admProd.[MODULE_ID] 
INNER JOIN  [OS_DBname].dbo.[OSSYS_APPLICATION] applProd on applProd.[ID] = admProd.[APPLICATION_ID] 

WHERE (applProd.[ID] = @ProducerApplicationId 
OR @ProducerApplicationId = '') 
AND espCons.Is_Active = 1 
 
ORDER BY 
applCons.Name 
, espCons.[NAME] 
, applProd.Name 
, rfx.Producer_Name 
, rfx.Name