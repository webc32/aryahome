<?
use Bitrix\Main\Type\Collection;
use Bitrix\Currency\CurrencyTable;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();
/** @var CBitrixComponentTemplate $this */
/** @var array $arParams */
/** @var array $arResult */
$arDefaultParams = array(
	'TYPE_SKU' => 'N',
	'FILTER_HIT_PROP' => 'block',
	'OFFER_TREE_PROPS' => array('-'),
);
$arParams = array_merge($arDefaultParams, $arParams);

if(isset($arParams['STORES'])) {
	foreach($arParams['STORES'] as $key => $store) {
		if(!$store) {
			unset($arParams['STORES'][$key]);
		}
	}
}


if ('TYPE_1' != $arParams['TYPE_SKU'] )
	$arParams['TYPE_SKU'] = 'N';

/*stores product*/
$arStores=CMax::CCatalogStore_GetList(array(), array("ACTIVE" => "Y"), false, false, array());
$arResult["STORES_COUNT"] = (count($arStores) && (CMax::GetFrontParametrValue("USE_STORE_QUANTITY")== "Y"));

/* hide compare link from module options */
if(CMax::GetFrontParametrValue('CATALOG_COMPARE') == 'N')
	$arParams["DISPLAY_COMPARE"] = 'N';
/**/

if (!empty($arResult['ITEMS'])){
	$arConvertParams = array();
	if ('Y' == $arParams['CONVERT_CURRENCY'])
	{
		if (!CModule::IncludeModule('currency'))
		{
			$arParams['CONVERT_CURRENCY'] = 'N';
			$arParams['CURRENCY_ID'] = '';
		}
		else
		{
			$arResultModules['currency'] = true;
			if($arResult['CURRENCY_ID'])
			{
				$arConvertParams['CURRENCY_ID'] = $arResult['CURRENCY_ID'];
			}
			else
			{
				$arCurrencyInfo = CCurrency::GetByID($arParams['CURRENCY_ID']);
				if (!(is_array($arCurrencyInfo) && !empty($arCurrencyInfo)))
				{
					$arParams['CONVERT_CURRENCY'] = 'N';
					$arParams['CURRENCY_ID'] = '';
				}
				else
				{
					$arParams['CURRENCY_ID'] = $arCurrencyInfo['CURRENCY'];
					$arConvertParams['CURRENCY_ID'] = $arCurrencyInfo['CURRENCY'];
				}
			}
		}
	}

	$arEmptyPreview = false;
	$strEmptyPreview = $this->GetFolder().'/images/no_photo.png';
	if (file_exists($_SERVER['DOCUMENT_ROOT'].$strEmptyPreview))
	{
		$arSizes = getimagesize($_SERVER['DOCUMENT_ROOT'].$strEmptyPreview);
		if (!empty($arSizes))
		{
			$arEmptyPreview = array(
				'SRC' => $strEmptyPreview,
				'WIDTH' => intval($arSizes[0]),
				'HEIGHT' => intval($arSizes[1])
			);
		}
		unset($arSizes);
	}
	unset($strEmptyPreview);

	$arSKUPropList = array();
	$arSKUPropIDs = array();
	$arSKUPropKeys = array();
	$boolSKU = false;
	$strBaseCurrency = '';
	$boolConvert = isset($arResult['CONVERT_CURRENCY']['CURRENCY_ID']);

	if ($arResult['MODULES']['catalog'])
	{
		if (!$boolConvert)
			$strBaseCurrency = CCurrency::GetBaseCurrency();

		$arSKU = CCatalogSKU::GetInfoByProductIBlock($arParams['IBLOCK_ID']);

		$boolSKU = !empty($arSKU) && is_array($arSKU);
		$bUseModuleProps = \Bitrix\Main\Config\Option::get("iblock", "property_features_enabled", "N") === "Y";

		if ($bUseModuleProps)
			$arParams['OFFERS_CART_PROPERTIES'] = \Bitrix\Catalog\Product\PropertyCatalogFeature::getBasketPropertyCodes($arSKU['IBLOCK_ID'], ['CODE' => 'Y']);

		if ('TYPE_1' === $arParams['TYPE_SKU'] && $arParams['DISPLAY_TYPE'] !== 'table') {
			if (!is_array($arParams['OFFER_TREE_PROPS']))
				$arParams['OFFER_TREE_PROPS'] = array($arParams['OFFER_TREE_PROPS']);

			foreach ($arParams['OFFER_TREE_PROPS'] as $key => $value) {
				$value = (string)$value;
				if ('' == $value || '-' == $value)
					unset($arParams['OFFER_TREE_PROPS'][$key]);
			}

			if (empty($arParams['OFFER_TREE_PROPS']) && isset($arParams['OFFERS_CART_PROPERTIES']) && is_array($arParams['OFFERS_CART_PROPERTIES'])) {
				$arParams['OFFER_TREE_PROPS'] = $arParams['OFFERS_CART_PROPERTIES'];
				
				foreach ($arParams['OFFER_TREE_PROPS'] as $key => $value) {
					$value = (string)$value;
					
					if ('' == $value || '-' == $value)
						unset($arParams['OFFER_TREE_PROPS'][$key]);
				}
			}
		} else {
			$arParams['OFFER_TREE_PROPS'] = array();
		}

		if ( $bUseModuleProps && $boolSKU && $featureProps = \Bitrix\Catalog\Product\PropertyCatalogFeature::getOfferTreePropertyCodes( $arSKU["IBLOCK_ID"], array('CODE' => 'Y') ) ) {
			$arParams['OFFER_TREE_PROPS'] = $featureProps;
		}
		if ( $boolSKU && $featureProps = \Bitrix\Iblock\Model\PropertyFeature::getListPageShowPropertyCodes( $arSKU["IBLOCK_ID"], array('CODE' => 'Y') ) ) {
			$arParams['OFFERS_PROPERTY_CODE'] = $featureProps;
		}
		if ($boolSKU && !empty($arParams['OFFER_TREE_PROPS']))
		{
			$arSKUPropList = CIBlockPriceTools::getTreeProperties(
				$arSKU,
				$arParams['OFFER_TREE_PROPS'],
				array(
					//'PICT' => $arEmptyPreview,
					'NAME' => '-'
				)
			);

			$arResult["SKU_IBLOCK_ID"]=$arSKU["IBLOCK_ID"];
			$arNeedValues = array();
			CIBlockPriceTools::getTreePropertyValues($arSKUPropList, $arNeedValues);
			$arSKUPropIDs = array_keys($arSKUPropList);
			if($featureProps) {
				$arParams['OFFER_TREE_PROPS'] = $arSKUPropIDs;
			}

			if (empty($arSKUPropIDs))
				$arParams['TYPE_SKU'] = 'N';
			else
				$arSKUPropKeys = array_fill_keys($arSKUPropIDs, false);
		}
	}

	$arNewItemsList = array();

	foreach ($arResult['ITEMS'] as $key => $arItem)
	{

		if($arItem["DETAIL_PICTURE"]){
			$arItem["PREVIEW_PICTURE"] = $arItem["DETAIL_PICTURE"];
		}
		
		if(is_array($arItem['PROPERTIES']['CML2_ARTICLE']['VALUE']))
		{
			$arItem['PROPERTIES']['CML2_ARTICLE']['VALUE'] = reset($arItem['PROPERTIES']['CML2_ARTICLE']['VALUE']);
			$arResult['ITEMS'][$key]['PROPERTIES']['CML2_ARTICLE']['VALUE'] = $arItem['PROPERTIES']['CML2_ARTICLE']['VALUE'];
			if($arItem['DISPLAY_PROPERTIES']['CML2_ARTICLE'])
			{
				$arItem['DISPLAY_PROPERTIES']['CML2_ARTICLE']['VALUE'] = reset($arItem['DISPLAY_PROPERTIES']['CML2_ARTICLE']['VALUE']);
				$arResult['ITEMS'][$key]['DISPLAY_PROPERTIES']['CML2_ARTICLE']['VALUE'] = $arItem['DISPLAY_PROPERTIES']['CML2_ARTICLE']['VALUE'];
			}
		}
		$bBigBlock = false;
		if ($arItem['PROPERTIES']['BIG_BLOCK']['VALUE'] == 'Y' && $arParams['SHOW_BIG_BLOCK'] != 'N') {
			$bBigBlock = true;
		}

		$arItem['CHECK_QUANTITY'] = false;
		if (!isset($arItem['CATALOG_MEASURE_RATIO']))
			$arItem['CATALOG_MEASURE_RATIO'] = 1;
		if (!isset($arItem['CATALOG_QUANTITY']))
			$arItem['CATALOG_QUANTITY'] = 0;
		$arItem['CATALOG_QUANTITY'] = (
			0 < $arItem['CATALOG_QUANTITY'] && is_float($arItem['CATALOG_MEASURE_RATIO'])
			? floatval($arItem['CATALOG_QUANTITY'])
			: intval($arItem['CATALOG_QUANTITY'])
		);
		$arItem['CATALOG'] = false;
		if (!isset($arItem['CATALOG_SUBSCRIPTION']) || 'Y' != $arItem['CATALOG_SUBSCRIPTION'])
			$arItem['CATALOG_SUBSCRIPTION'] = 'N';

		if ($arResult['MODULES']['catalog'])
		{
			$arItem['CATALOG'] = true;
			if (!isset($arItem['CATALOG_TYPE']))
				$arItem['CATALOG_TYPE'] = CCatalogProduct::TYPE_PRODUCT;
			if (
				(CCatalogProduct::TYPE_PRODUCT == $arItem['CATALOG_TYPE'] || CCatalogProduct::TYPE_SKU == $arItem['CATALOG_TYPE'])
				&& !empty($arItem['OFFERS'])
			)
			{
				$arItem['CATALOG_TYPE'] = CCatalogProduct::TYPE_SKU;
			}
			switch ($arItem['CATALOG_TYPE'])
			{
				case CCatalogProduct::TYPE_SET:
				$arItem['OFFERS'] = array();
				$arItem['CHECK_QUANTITY'] = ('Y' == $arItem['CATALOG_QUANTITY_TRACE'] && 'N' == $arItem['CATALOG_CAN_BUY_ZERO']);

				$arSets = CCatalogProductSet::getAllSetsByProduct($arItem["ID"], 1);
				if($arSets)
				{
					foreach($arSets as $arSet2)
					{
						foreach($arSet2["ITEMS"] as $arSet3)
						{
							$arItem['SET_ITEMS'][] = array(
								"ID" => $arSet3["ITEM_ID"],
								"QUANTITY" => $arSet3["QUANTITY"]
							);
						}
					}
				}

				break;
				case CCatalogProduct::TYPE_SKU:
				break;
				case CCatalogProduct::TYPE_PRODUCT:
				default:
				$arItem['CHECK_QUANTITY'] = ('Y' == $arItem['CATALOG_QUANTITY_TRACE'] && 'N' == $arItem['CATALOG_CAN_BUY_ZERO']);
				break;
			}
		}
		else
		{
			$arItem['CATALOG_TYPE'] = 0;
			$arItem['OFFERS'] = array();
		}


		if(($arItem['DETAIL_PICTURE'] && $arItem['PREVIEW_PICTURE']) || (!$arItem['DETAIL_PICTURE'] && $arItem['PREVIEW_PICTURE']))
			$arItem['DETAIL_PICTURE'] = $arItem['PREVIEW_PICTURE'];

							
		if ($_POST['offer_ajax'] && ($_POST['product_color'] || $_POST['product_size'])) {
			$arParams['ADD_DETAIL_TO_SLIDER'] = 'Y';
		}



		$arItem['GALLERY'] = CMax::getSliderForItemExt($arItem, $arParams['ADD_PICT_PROP'], 'Y' == $arParams['ADD_DETAIL_TO_SLIDER']);
		
		array_splice($arItem['GALLERY'], $arParams['MAX_GALLERY_ITEMS']);
		

		if ($arItem['CATALOG'] && isset($arItem['OFFERS']) && !empty($arItem['OFFERS']))
		{
			$arMatrixFields = $arSKUPropKeys;
			$arMatrix = array();

			$arNewOffers = array();
			$boolSKUDisplayProperties = false;
			$arItem['OFFERS_PROP'] = false;

			$arDouble = array();
			foreach ($arItem['OFFERS'] as $keyOffer => $arOffer)
			{
				$arOffer['ID'] = intval($arOffer['ID']);
				if (isset($arDouble[$arOffer['ID']]))
					continue;
				$arRow = array();
				foreach ($arSKUPropIDs as $propkey => $strOneCode)
				{
					$arCell = array(
						'VALUE' => 0,
						'SORT' => PHP_INT_MAX,
						'NA' => true
					);
					if (isset($arOffer['DISPLAY_PROPERTIES'][$strOneCode]) && ( !$bUseModuleProps || in_array($strOneCode, $arParams['OFFERS_PROPERTY_CODE']) ))
					{
						$arMatrixFields[$strOneCode] = true;
						$arCell['NA'] = false;
						if ('directory' == $arSKUPropList[$strOneCode]['USER_TYPE'])
						{
							$intValue = $arSKUPropList[$strOneCode]['XML_MAP'][$arOffer['DISPLAY_PROPERTIES'][$strOneCode]['VALUE']];
							$arCell['VALUE'] = $intValue;
						}
						elseif ('L' == $arSKUPropList[$strOneCode]['PROPERTY_TYPE'])
						{
							$arCell['VALUE'] = intval($arOffer['DISPLAY_PROPERTIES'][$strOneCode]['VALUE_ENUM_ID']);
						}
						elseif ('E' == $arSKUPropList[$strOneCode]['PROPERTY_TYPE'])
						{
							$arCell['VALUE'] = intval($arOffer['DISPLAY_PROPERTIES'][$strOneCode]['VALUE']);
						}
						$arCell['SORT'] = $arSKUPropList[$strOneCode]['VALUES'][$arCell['VALUE']]['SORT'];
					}
					$arRow[$strOneCode] = $arCell;
				}
				$arMatrix[$keyOffer] = $arRow;

				CIBlockPriceTools::clearProperties($arOffer['DISPLAY_PROPERTIES'], $arParams['OFFER_TREE_PROPS']);

				CIBlockPriceTools::setRatioMinPrice($arOffer, false);

				$offerPictures = CIBlockPriceTools::getDoublePicturesForItem($arOffer, $arParams['OFFER_ADD_PICT_PROP']);

				$arOffer['OWNER_PICT'] = empty($offerPictures['PICT']);
				$arOffer['PREVIEW_PICTURE_FIELD'] = $arOffer['PREVIEW_PICTURE'];
				$arOffer['PREVIEW_PICTURE'] = false;
				$arOffer['PREVIEW_PICTURE_SECOND'] = false;
				$arOffer['SECOND_PICT'] = true;
				if (!$arOffer['OWNER_PICT'])
				{
					if (empty($offerPictures['SECOND_PICT']))
						$offerPictures['SECOND_PICT'] = $offerPictures['PICT'];
					$arOffer['PREVIEW_PICTURE'] = $offerPictures['PICT'];
					$arOffer['PREVIEW_PICTURE_SECOND'] = $offerPictures['SECOND_PICT'];
				}

				if ('' != $arParams['OFFER_ADD_PICT_PROP'] && isset($arOffer['DISPLAY_PROPERTIES'][$arParams['OFFER_ADD_PICT_PROP']]))
					unset($arOffer['DISPLAY_PROPERTIES'][$arParams['OFFER_ADD_PICT_PROP']]);

				if($arParams["USE_MAIN_ELEMENT_SECTION"] != "Y")
				{
					if($arOffer["DETAIL_PAGE_URL"])
					{
						$arTmpUrl = explode("?", $arOffer["DETAIL_PAGE_URL"]);
						$arOffer["DETAIL_PAGE_URL"] = str_replace($arTmpUrl[0], $arItem["DETAIL_PAGE_URL"], $arOffer["DETAIL_PAGE_URL"]);
					}
				}

				
				/* get additional query for OFFER price when PRICE_RANGE will start not from 1 */
				if (!$arOffer['PRICES'] && $arResult['PRICES']) {
					if ($arOffer['ITEM_PRICE_MODE'] === 'Q') {
						$arOfferPrices = CIBlockElement::GetList($arOrder, ['ID' => $arOffer['ID']], false, false, array_merge(['ID', 'NAME'], array_column($arResult['PRICES'], 'SELECT')))->Fetch();
						$arOffer['PRICES'] = CIBlockPriceTools::GetItemPrices($arOffer["IBLOCK_ID"], $arResult['PRICES'], $arOfferPrices, 'Y', $arConvertParams);
						if (!empty($arOffer["PRICES"])) {
							foreach ($arOffer['PRICES'] as &$arOnePrice) {
								if ($arOnePrice['MIN_PRICE'] == 'Y') {
									$arOffer['MIN_PRICE'] = $arOnePrice;
									break;
								}
							}
							unset($arOnePrice);
						}
					}
					
				}
				/* */

				$arDouble[$arOffer['ID']] = true;
				$arNewOffers[$keyOffer] = $arOffer;

			}


			$arItem['OFFERS'] = $arNewOffers;

			$arUsedFields = array();
			$arSortFields = array();

			$arPropSKU = $arItem['OFFERS_PROPS_JS'] = array();

			foreach ($arSKUPropIDs as $propkey => $strOneCode)
			{
				$boolExist = $arMatrixFields[$strOneCode];
				foreach ($arMatrix as $keyOffer => $arRow)
				{
					if ($boolExist)
					{
						if (!isset($arItem['OFFERS'][$keyOffer]['TREE']))
							$arItem['OFFERS'][$keyOffer]['TREE'] = array();
						$arItem['OFFERS'][$keyOffer]['TREE']['PROP_'.$arSKUPropList[$strOneCode]['ID']] = $arMatrix[$keyOffer][$strOneCode]['VALUE'];
						$arItem['OFFERS'][$keyOffer]['SKU_SORT_'.$strOneCode] = $arMatrix[$keyOffer][$strOneCode]['SORT'];
						$arUsedFields[$strOneCode] = true;
						$arSortFields['SKU_SORT_'.$strOneCode] = SORT_NUMERIC;

						$arPropSKU[$strOneCode][$arMatrix[$keyOffer][$strOneCode]["VALUE"]] = $arSKUPropList[$strOneCode]["VALUES"][$arMatrix[$keyOffer][$strOneCode]["VALUE"]];
					}
					else
					{
						unset($arMatrix[$keyOffer][$strOneCode]);
					}
				}
				if($arPropSKU[$strOneCode])
				{
					Collection::sortByColumn($arPropSKU[$strOneCode], array("SORT" => array(SORT_NUMERIC, SORT_ASC), "NAME" => array(SORT_NUMERIC, SORT_ASC))); // sort sku prop values
					$arItem['OFFERS_PROPS_JS'][$strOneCode] = array(
						"ID" => $arSKUPropList[$strOneCode]["ID"],
						"CODE" => $arSKUPropList[$strOneCode]["CODE"],
						"NAME" => $arSKUPropList[$strOneCode]["NAME"],
						"SORT" => $arSKUPropList[$strOneCode]["SORT"],
						"PROPERTY_TYPE" => $arSKUPropList[$strOneCode]["PROPERTY_TYPE"],
						"USER_TYPE" => $arSKUPropList[$strOneCode]["USER_TYPE"],
						"LINK_IBLOCK_ID" => $arSKUPropList[$strOneCode]["LINK_IBLOCK_ID"],
						"SHOW_MODE" => $arSKUPropList[$strOneCode]["SHOW_MODE"],
						"VALUES" => $arPropSKU[$strOneCode],
						'SHOW_HINTS' => $arParams['SHOW_HINTS'],
						'HINT' => $arOffer['PROPERTIES'][$strOneCode]['HINT'],
					);
				}
			}
			$arItem['OFFERS_PROP'] = $arUsedFields;
			// $arItem['OFFERS_PROP_CODES'] = (!empty($arUsedFields) ? base64_encode(serialize(array_keys($arUsedFields))) : '');
			$arItem['OFFERS_PROP_CODES'] = (!empty($arParams["OFFERS_CART_PROPERTIES"]) ? base64_encode(serialize(array_keys($arParams["OFFERS_CART_PROPERTIES"]))) : '');

			Collection::sortByColumn($arItem['OFFERS'], $arSortFields);

			$arMatrix = array();
			$intSelected = -1;
			$arItem['MIN_PRICE'] = false;
			$arItem['MIN_BASIS_PRICE'] = false;

			if ($bBigBlock) {
				$arItem['OFFERS_PROP'] = false;
			}

			if(!$arItem['OFFERS_PROP'])
			{
				//set min price when USE_PRICE_COUNT
				if($arParams['USE_PRICE_COUNT'] == 'Y')
				{
					$arPriceTypeID = array();
					foreach($arItem['OFFERS'] as $keyOffer => $arOffer)
					{
						//format prices when USE_PRICE_COUNT
						if(function_exists('CatalogGetPriceTableEx') && (isset($arOffer['PRICE_MATRIX'])) && !$arOffer['PRICE_MATRIX'])
						{
							if($arOffer['PRICES'])
							{
								foreach($arOffer['PRICES'] as $priceKey => $arOfferPrice)
								{
									if($arOffer['CATALOG_GROUP_NAME_'.$arOfferPrice['PRICE_ID']])
									{
										$arPriceTypeID[] = $arOfferPrice['PRICE_ID'];
										$arOffer['PRICES'][$priceKey]['GROUP_NAME'] = $arOffer['CATALOG_GROUP_NAME_'.$arOfferPrice['PRICE_ID']];
									}
								}
							}
							$arOffer["PRICE_MATRIX"] = CatalogGetPriceTableEx($arOffer["ID"], 0, $arPriceTypeID, 'Y', $arConvertParams);
							if(count($arOffer['PRICE_MATRIX']['ROWS']) <= 1)
							{
								$arOffer['PRICE_MATRIX'] = '';
							}
						}
						$arItem['OFFERS'][$keyOffer] = array_merge($arOffer, CMax::formatPriceMatrix($arOffer));					

					}
				}

				$arItem['MIN_PRICE'] = CMax::getMinPriceFromOffersExt(
					$arItem['OFFERS'],
					$boolConvert ? $arResult['CONVERT_CURRENCY']['CURRENCY_ID'] : $strBaseCurrency
				);
			}
			else
			{
				foreach ($arItem['OFFERS'] as $keyOffer => $arOffer)
				{
					//if (empty($arItem['MIN_PRICE']))
					//{
					if ($arItem['OFFER_ID_SELECTED'] > 0)
						$foundOffer = ($arItem['OFFER_ID_SELECTED'] == $arOffer['ID']);
					else
						$foundOffer = $arOffer['CAN_BUY'];
					if ($foundOffer && $intSelected == -1)
					{
						$intSelected = $keyOffer;
						$arItem['MIN_PRICE'] = (isset($arOffer['RATIO_PRICE']) ? $arOffer['RATIO_PRICE'] : $arOffer['MIN_PRICE']);
						$arItem['MIN_BASIS_PRICE'] = $arOffer['MIN_PRICE'];
					}
					unset($foundOffer);
					//}
				}

				if (-1 == $intSelected)
					$intSelected = 0;
				$arItem['OFFERS_SELECTED'] = $intSelected;

				foreach ($arItem['OFFERS'] as $keyOffer => $arOffer)
				{
					if($arItem['OFFERS_SELECTED'] !== $keyOffer){
						continue;
					}
					$arSKUProps =$arSKUArticle = false;
					if (!empty($arOffer['DISPLAY_PROPERTIES']))
					{
						$boolSKUDisplayProperties = true;
						$arSKUProps = array();
						foreach ($arOffer['DISPLAY_PROPERTIES'] as &$arOneProp)
						{
							if ('F' == $arOneProp['PROPERTY_TYPE'])
								continue;
							$arSKUProps[] = array(
								'NAME' => $arOneProp['NAME'],
								'VALUE' => $arOneProp['DISPLAY_VALUE'],
								'CODE' => $arOneProp['CODE'],
							);
						}
						unset($arOneProp);
					}

					$totalCount = CMax::GetTotalCount($arOffer, $arParams);
					$arOffer['IS_OFFER'] = 'Y';
					$arOffer['IBLOCK_ID'] = $arResult['IBLOCK_ID'];

					$arPriceTypeID = array();
					if($arOffer['PRICES'])
					{
						foreach($arOffer['PRICES'] as $priceKey => $arOfferPrice)
						{
							if($arOfferPrice['CAN_BUY'] == 'Y')
								$arPriceTypeID[] = $arOfferPrice['PRICE_ID'];
							if($arOffer['CATALOG_GROUP_NAME_'.$arOfferPrice['PRICE_ID']])
								$arOffer['PRICES'][$priceKey]['GROUP_NAME'] = $arOffer['CATALOG_GROUP_NAME_'.$arOfferPrice['PRICE_ID']];
						}
					}

					//format offer prices when USE_PRICE_COUNT
					$sPriceMatrix = '';
					// if($arParams['USE_PRICE_COUNT'] == 'Y')
					if($arOffer['ITEM_PRICE_MODE'] === 'Q')
					{
						if(function_exists('CatalogGetPriceTableEx') && (isset($arOffer['PRICE_MATRIX'])) && !$arOffer['PRICE_MATRIX'] && $arPriceTypeID)
						{
							$arOffer["PRICE_MATRIX"] = CatalogGetPriceTableEx($arOffer["ID"], 0, $arPriceTypeID, 'Y', $arConvertParams);
							if(count($arOffer['PRICE_MATRIX']['ROWS']) <= 1)
							{
								$arOffer['PRICE_MATRIX'] = '';
							}
						}
						$arOffer = array_merge($arOffer, CMax::formatPriceMatrix($arOffer));
						$sPriceMatrix = CMax::showPriceMatrix($arOffer, $arParams, $arOffer['~CATALOG_MEASURE_NAME']);
					}

					$arAddToBasketData = CMax::GetAddToBasketArray($arOffer, $totalCount, $arParams["DEFAULT_COUNT"], $arParams["BASKET_URL"], false, $arItemIDs["ALL_ITEM_IDS"], 'small read_more1', $arParams);
					$arAddToBasketData["HTML"] = str_replace('data-item', 'data-props="'.$arOfferProps.'" data-item', $arAddToBasketData["HTML"]);

					$arOneRow = array(
						'ID' => $arOffer['ID'],
						'NAME' => $arOffer['~NAME'],
						'TREE' => $arOffer['TREE'],
						'DISPLAY_PROPERTIES' => $arSKUProps,
						'ARTICLE' => $arSKUArticle,
						// 'PRICE' => (isset($arOffer['RATIO_PRICE']) ? $arOffer['RATIO_PRICE'] : $arOffer['MIN_PRICE']),
						'PRICE' => $arOffer['MIN_PRICE'],
						'SHOW_DISCOUNT_TIME_EACH_SKU' => $arParams['SHOW_DISCOUNT_TIME_EACH_SKU'],
						'PRICES' => $arOffer['PRICES'],
						'USE_PRICE_COUNT' => $arParams['USE_PRICE_COUNT'],
						'SHOW_DISCOUNT_PERCENT_NUMBER' => $arParams['SHOW_DISCOUNT_PERCENT_NUMBER'],
						'SHOW_ARTICLE_SKU' => $arParams['SHOW_ARTICLE_SKU'],
						'ARTICLE_SKU' => ($arParams['SHOW_ARTICLE_SKU'] == 'Y' ? (isset($arItem['PROPERTIES']['CML2_ARTICLE']['VALUE']) && $arItem['PROPERTIES']['CML2_ARTICLE']['VALUE'] ? $arItem['PROPERTIES']['CML2_ARTICLE']['NAME'].': '.$arItem['PROPERTIES']['CML2_ARTICLE']['VALUE'] : '') : ''),
						'PRICE_MATRIX' => $sPriceMatrix,
						'PRICE_MATRIX_RAW' => $arOffer["PRICE_MATRIX"],
						'BASIS_PRICE' => $arOffer['MIN_PRICE'],
						'OWNER_PICT' => $arOffer['OWNER_PICT'],
						'PREVIEW_PICTURE' => $arOffer['PREVIEW_PICTURE'],
						'PREVIEW_PICTURE_SECOND' => $arOffer['PREVIEW_PICTURE_SECOND'],
						'CHECK_QUANTITY' => $arOffer['CHECK_QUANTITY'],
						'MAX_QUANTITY' => $totalCount,
						'STEP_QUANTITY' => $arOffer['CATALOG_MEASURE_RATIO'],
						'QUANTITY_FLOAT' => is_double($arOffer['CATALOG_MEASURE_RATIO']),
						'MEASURE' => $arOffer['~CATALOG_MEASURE_NAME'],
						'CAN_BUY' => ($arAddToBasketData['CAN_BUY'] ? 'Y' : $arOffer['CAN_BUY']),
						'CATALOG_SUBSCRIBE' => $arOffer['CATALOG_SUBSCRIBE'],
						'AVAILIABLE' => CMax::GetQuantityArray($totalCount),
						'URL' => $arOffer['DETAIL_PAGE_URL'],
						'SHOW_MEASURE' => ($arParams["SHOW_MEASURE"]=="Y" ? "Y" : "N"),
						'SHOW_ONE_CLICK_BUY' => "N",
						'ONE_CLICK_BUY' => GetMessage("ONE_CLICK_BUY"),
						'OFFER_PROPS' => $arOfferProps,
						'NO_PHOTO' => $arEmptyPreview,
						'CONFIG' => $arAddToBasketData,
						'HTML' => $arAddToBasketData["HTML"],
						'PRODUCT_QUANTITY_VARIABLE' => $arParams["PRODUCT_QUANTITY_VARIABLE"],
						'SUBSCRIPTION' => true,
						'ITEM_PRICE_MODE' => $arOffer['ITEM_PRICE_MODE'],
						'ITEM_PRICES' => $arOffer['ITEM_PRICES'],
						'ITEM_PRICE_SELECTED' => $arOffer['ITEM_PRICE_SELECTED'],
						'ITEM_QUANTITY_RANGES' => $arOffer['ITEM_QUANTITY_RANGES'],
						'ITEM_QUANTITY_RANGE_SELECTED' => $arOffer['ITEM_QUANTITY_RANGE_SELECTED'],
						'ITEM_MEASURE_RATIOS' => $arOffer['ITEM_MEASURE_RATIOS'],
						'ITEM_MEASURE_RATIO_SELECTED' => $arOffer['ITEM_MEASURE_RATIO_SELECTED'],
					);
					if($arOneRow["PRICE"]["DISCOUNT_DIFF"]){
						$percent=round(($arOneRow["PRICE"]["DISCOUNT_DIFF"]/$arOneRow["PRICE"]["VALUE"])*100, 2);
						$arOneRow["PRICE"]["DISCOUNT_DIFF_PERCENT_RAW"]="-".$percent."%";
					}
					$arMatrix[$keyOffer] = $arOneRow;

					if(($arOffer['DETAIL_PICTURE'] && $arOffer['PREVIEW_PICTURE']) || (!$arOffer['DETAIL_PICTURE'] && $arOffer['PREVIEW_PICTURE']))
						$arOffer['DETAIL_PICTURE'] = $arOffer['PREVIEW_PICTURE'];
					
					if ($arParams['SHOW_GALLERY'] == 'Y') {
						$arItem['OFFERS'][$keyOffer]['GALLERY'] = CMax::getSliderForItemExt($arOffer, $arParams['OFFER_ADD_PICT_PROP'], true);

						if ($arItem['GALLERY']) {
							$arItem['OFFERS'][$keyOffer]['GALLERY'] = array_merge($arItem['OFFERS'][$keyOffer]['GALLERY'], $arItem['GALLERY']);
						}
						if ($arItem['OFFERS'][$keyOffer]['GALLERY']) {
							array_splice($arItem['OFFERS'][$keyOffer]['GALLERY'], $arParams['MAX_GALLERY_ITEMS']);
							array_splice($arItem['GALLERY'], $arParams['MAX_GALLERY_ITEMS']);
						}
					}
				}
				
				if (!$arMatrix[$intSelected]['OWNER_PICT'])
				{
					$arItem['PREVIEW_PICTURE'] = $arMatrix[$intSelected]['PREVIEW_PICTURE'];
					$arItem['PREVIEW_PICTURE_SECOND'] = $arMatrix[$intSelected]['PREVIEW_PICTURE_SECOND'];
				}
				$arItem['JS_OFFERS'] = $arMatrix;
				$arItem['OFFERS_PROPS_DISPLAY'] = $boolSKUDisplayProperties;
			}
		}


		$arFirstSkuPicture = array();
		$bNeedFindPicture = ($arParams['SHOW_GALLERY'] == 'Y') && (CMax::GetFrontParametrValue("SHOW_FIRST_SKU_PICTURE") == "Y") && empty($arItem['GALLERY']);
		if( $bNeedFindPicture ){
			foreach ($arItem['OFFERS'] as $keyOffer => $arOffer)
			{
				if(($arOffer['DETAIL_PICTURE'] && $arOffer['PREVIEW_PICTURE']) || (!$arOffer['DETAIL_PICTURE'] && $arOffer['PREVIEW_PICTURE']))
					$arOffer['DETAIL_PICTURE'] = $arOffer['PREVIEW_PICTURE'];
				$arFirstSkuPicture = CMax::getSliderForItemExt($arOffer, '', true);
				if(!empty( $arFirstSkuPicture )){
					$arItem['GALLERY'] = $arFirstSkuPicture;
					break;
				}
			}
		}

		if($arParams["SET_SKU_TITLE"] === "Y"){
			if(isset($arItem["OFFERS_SELECTED"])){
				$ipropValues = new \Bitrix\Iblock\InheritedProperty\ElementValues($arItem['OFFERS'][$arItem["OFFERS_SELECTED"]]['IBLOCK_ID'], $arItem['OFFERS'][$arItem["OFFERS_SELECTED"]]['ID']);
				$arItem['OFFERS'][$arItem["OFFERS_SELECTED"]]['IPROPERTY_VALUES'] = $ipropValues->getValues();
			}
		}
		

		//set min price when USE_PRICE_COUNT
		if ($arParams['USE_PRICE_COUNT'] == 'Y') {
			if (!$arItem['OFFERS']) {
				$arItem["FIX_PRICE_MATRIX"] = CMax::checkPriceRangeExt($arItem);
			}
		} elseif (isset($arItem['ITEM_PRICE_MODE']) && $arItem['ITEM_PRICE_MODE'] === 'Q') {
			//set PRICE_MATRIX when PRICE_RANGE will start not from 1
			if (
				function_exists('CatalogGetPriceTableEx') 
				&& (isset($arItem['PRICE_MATRIX'])) 
				&& !$arItem['PRICE_MATRIX']
				&& $arResult['PRICES']
			) {
				$arItem['PRICE_MATRIX'] = CatalogGetPriceTableEx($arItem["ID"], 0, array_column($arResult['PRICES'], 'ID'), 'Y', $arConvertParams);
			}
			$arItem["FIX_PRICE_MATRIX"] = CMax::checkPriceRangeExt($arItem);
		}

		if (
			$arResult['MODULES']['catalog']
			&& $arItem['CATALOG']
			&&
			($arItem['CATALOG_TYPE'] == CCatalogProduct::TYPE_PRODUCT
				|| $arItem['CATALOG_TYPE'] == CCatalogProduct::TYPE_SET)
		)
		{
			CIBlockPriceTools::setRatioMinPrice($arItem, false);
			$arItem['MIN_BASIS_PRICE'] = $arItem['MIN_PRICE'];

		}

		if (!empty($arItem['DISPLAY_PROPERTIES']))
		{
			foreach ($arItem['DISPLAY_PROPERTIES'] as $propKey => $arDispProp)
			{
				if ('F' == $arDispProp['PROPERTY_TYPE'])
					unset($arItem['DISPLAY_PROPERTIES'][$propKey]);

			}
		}

		//format prices when USE_PRICE_COUNT
		$arItem = array_merge($arItem, CMax::formatPriceMatrix($arItem));

		$arItem['ARTICLE']=false;
		if (!empty($arItem['DISPLAY_PROPERTIES']))
		{
			foreach ($arItem['DISPLAY_PROPERTIES'] as $propKey => $arDispProp)
			{
				if($propKey=="CML2_ARTICLE"){
					$arItem['ARTICLE']=$arDispProp;
					unset($arItem['DISPLAY_PROPERTIES'][$propKey]);
				}
				if ('F' == $arDispProp['PROPERTY_TYPE'] || $arDispProp["CODE"] == $arParams["STIKERS_PROP"])
					unset($arItem['DISPLAY_PROPERTIES'][$propKey]);
			}
			$arItem['DISPLAY_PROPERTIES'] = CMax::PrepareItemProps($arItem['DISPLAY_PROPERTIES']);
		}

		$arItem['LAST_ELEMENT'] = 'N';

		if($arParams['IBINHERIT_TEMPLATES']){
			\Aspro\Max\Property\IBInherited::modifyItemTemplates($arParams, $arItem);
		}

		$arNewItemsList[$key] = $arItem;
	}

	$arNewItemsList[$key]['LAST_ELEMENT'] = 'Y';
	$arResult['ITEMS'] = $arNewItemsList;
	$arResult['SKU_PROPS'] = $arSKUPropList;
	$arResult['DEFAULT_PICTURE'] = $arEmptyPreview;



	unset($arNewItemsList);
	$arResult['CURRENCIES'] = array();
	if ($arResult['MODULES']['currency'])
	{
		if ($boolConvert)
		{
			$currencyFormat = CCurrencyLang::GetFormatDescription($arResult['CONVERT_CURRENCY']['CURRENCY_ID']);
			$arResult['CURRENCIES'] = array(
				array(
					'CURRENCY' => $arResult['CONVERT_CURRENCY']['CURRENCY_ID'],
					'FORMAT' => array(
						'FORMAT_STRING' => $currencyFormat['FORMAT_STRING'],
						'DEC_POINT' => $currencyFormat['DEC_POINT'],
						'THOUSANDS_SEP' => $currencyFormat['THOUSANDS_SEP'],
						'DECIMALS' => $currencyFormat['DECIMALS'],
						'THOUSANDS_VARIANT' => $currencyFormat['THOUSANDS_VARIANT'],
						'HIDE_ZERO' => $currencyFormat['HIDE_ZERO']
					)
				)
			);
			unset($currencyFormat);
		}
		else
		{
			$currencyIterator = CurrencyTable::getList(array(
				'select' => array('CURRENCY')
			));
			while ($currency = $currencyIterator->fetch())
			{
				$currencyFormat = CCurrencyLang::GetFormatDescription($currency['CURRENCY']);
				$arResult['CURRENCIES'][] = array(
					'CURRENCY' => $currency['CURRENCY'],
					'FORMAT' => array(
						'FORMAT_STRING' => $currencyFormat['FORMAT_STRING'],
						'DEC_POINT' => $currencyFormat['DEC_POINT'],
						'THOUSANDS_SEP' => $currencyFormat['THOUSANDS_SEP'],
						'DECIMALS' => $currencyFormat['DECIMALS'],
						'THOUSANDS_VARIANT' => $currencyFormat['THOUSANDS_VARIANT'],
						'HIDE_ZERO' => $currencyFormat['HIDE_ZERO']
					)
				);
			}
			unset($currencyFormat, $currency, $currencyIterator);
		}
	}

	$arResult['CUSTOM_RESIZE_OPTIONS'] = array();
	if( $arParams['USE_CUSTOM_RESIZE_LIST'] == 'Y' ) {
		$arIBlockFields = CIBlock::GetFields($arParams["IBLOCK_ID"]);
		if($arIBlockFields['PREVIEW_PICTURE'] && $arIBlockFields['PREVIEW_PICTURE']['DEFAULT_VALUE'])
		{
			if($arIBlockFields['PREVIEW_PICTURE']['DEFAULT_VALUE']['WIDTH'] && $arIBlockFields['PREVIEW_PICTURE']['DEFAULT_VALUE']['HEIGHT'])
			{
				$arResult['CUSTOM_RESIZE_OPTIONS'] = $arIBlockFields['PREVIEW_PICTURE']['DEFAULT_VALUE'];
			}
		}
	}
}

$arFilter = array();
foreach ($arResult['ITEMS'] as $key => $arItem) {
	$arKeys[] = $arItem['ID'];
	$nameForSite[$key] = $arItem['PROPERTIES']['NAIMENOVANIE_DLYA_SAYTA']["VALUE"];
	$color[$key] = $arItem['PROPERTIES']['PROPERTY_TSVET']["VALUE"];
}


// Массив для искусственной сортировки
$sizesOrder = array(
	'XS'    => 100,
	'S'     => 110,
	'M'     => 120,
	'L'     => 130,
	'XL'    => 140,
	'XXL'   => 150,
	'3XL'   => 160,
	'XXXL'  => 161,
	'4XL'   => 170,
	'XXXXL' => 171,
);

$i = 0;
$arSort= Array("NAME"=>"ASC");
$arSelect = Array("ID","NAME","IBLOCK_ID","PROPERTY_NAIMENOVANIE_DLYA_SAYTA","PROPERTY_RAZMER","PROPERTY_TSVET","PREVIEW_PICTURE","DETAIL_PAGE_URL","PROPERTY_OBSHCHIY_RAZMER_DLYA_SAYTA");
$arFilter = Array(
	"IBLOCK_ID" => $arParams['IBLOCK_ID'],
	'>CATALOG_STORE_AMOUNT_3' => 0,
	"PROPERTY_NAIMENOVANIE_DLYA_SAYTA" => $nameForSite,
	"ACTIVE" => "Y",
	"!SECTION_ID" => 0
);
$res = CIBlockElement::GetList($arSort, $arFilter, false, false, $arSelect);
$availabelSku = array();
while($ob = $res->GetNextElement()){

	$arFields = $ob->GetFields();
	if(!$arSku[$arFields['PROPERTY_NAIMENOVANIE_DLYA_SAYTA_VALUE']][$arFields["PROPERTY_TSVET_VALUE"]]){
		$availabelSku[$arFields['PROPERTY_NAIMENOVANIE_DLYA_SAYTA_VALUE']]["COLOR"]++;
		$arSku[$arFields['PROPERTY_NAIMENOVANIE_DLYA_SAYTA_VALUE']][$arFields["PROPERTY_TSVET_VALUE"]] = array(
			"ID" => $arFields['ID'],
			"SRC" => $arFields["PREVIEW_PICTURE"] ? CFile::GetPath($arFields["PREVIEW_PICTURE"]) : SITE_TEMPLATE_PATH.'/images/svg/noimage_product.svg',
			"COLOR" => $arFields["PROPERTY_TSVET_VALUE"],
		);
	}

	if(!$arFields["PROPERTY_OBSHCHIY_RAZMER_DLYA_SAYTA_VALUE"]){
		$arFields["PROPERTY_OBSHCHIY_RAZMER_DLYA_SAYTA_VALUE"] = $arFields["PROPERTY_RAZMER_VALUE"];
	}

	if($arFields["PROPERTY_OBSHCHIY_RAZMER_DLYA_SAYTA_VALUE"]){
		$availabelSku[$arFields['PROPERTY_NAIMENOVANIE_DLYA_SAYTA_VALUE']]["SIZE"]++;
		$arSku[$arFields['PROPERTY_NAIMENOVANIE_DLYA_SAYTA_VALUE']][$arFields["PROPERTY_TSVET_VALUE"]]["SIZE"][] = 
		array(
			"ID" => $arFields['ID'],
			"RAZMER" => $arFields["PROPERTY_OBSHCHIY_RAZMER_DLYA_SAYTA_VALUE"],
			"COLOR" => $arFields["PROPERTY_TSVET_VALUE"],

			// Присваем индексы для дальнейшей сортировки
			"ORDER" => array_key_exists($arFields["PROPERTY_OBSHCHIY_RAZMER_DLYA_SAYTA_VALUE"], $sizesOrder) ?  $sizesOrder[$arFields["PROPERTY_OBSHCHIY_RAZMER_DLYA_SAYTA_VALUE"]] : 0,
		);
	}

}

// Функция сортировки по полю ORDER
function cmp($a, $b) {
	return strnatcmp($a["ORDER"], $b["ORDER"]);
}

// далее запишим всё по своим местам + скрипт ajax на обновление данных о товаре
foreach ($arResult['ITEMS'] as $key => $arItem) {
	if(array_key_exists($arItem['PROPERTIES']['NAIMENOVANIE_DLYA_SAYTA']["VALUE"], $arSku) && $arItem['PROPERTIES']['NAIMENOVANIE_DLYA_SAYTA']["VALUE"]){
		//$currentColor = ($_POST['product_color'] ? $_POST['product_color'] : ($arItem['PROPERTIES']['TSVET']['VALUE'] == $offer['COLOR'] ? $offer['ID'] : $arItem['ID']));
		//$currentSize = ($_POST['product_size'] ? $_POST['product_size'] : ($currentColor ? $currentColor : $arItem['ID']));
		
		foreach ($arSku[$arItem['PROPERTIES']['NAIMENOVANIE_DLYA_SAYTA']["VALUE"]] as &$prop) {
			// Искусственная сортировка по размеру
			usort($prop['SIZE'], "cmp");

			if($_POST['product_color'] == $prop['ID']){
				$prop['SELECTED'] = "Y";
				findSelectedSize($arItem,$prop,$_POST['product_size']);
				break;
			}elseif($arItem['PROPERTIES']['TSVET']['VALUE'] == $prop['COLOR']){
				$prop['SELECTED'] = "Y";
				findSelectedSize($arItem,$prop);
				break;
			}
		}

		$arResult['ITEMS'][$key]['OFFERS_CUSTOM'] = $arSku[$arItem['PROPERTIES']['NAIMENOVANIE_DLYA_SAYTA']["VALUE"]];
	}
}


?>
