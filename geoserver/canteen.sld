<?xml version="1.0" encoding="UTF-8"?>
<!-- WMS style for the layer canteenfinder:canteens: one blue circle with a white border per canteen -->
<StyledLayerDescriptor version="1.0.0"
	xmlns="http://www.opengis.net/sld"
	xmlns:ogc="http://www.opengis.net/ogc"
	xmlns:xlink="http://www.w3.org/1999/xlink"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd">
	<NamedLayer>
		<Name>canteen</Name>
		<UserStyle>
			<Title>Canteen</Title>
			<FeatureTypeStyle>
				<Rule>
					<Title>Canteen</Title>
					<PointSymbolizer>
						<Graphic>
							<Mark>
								<WellKnownName>circle</WellKnownName>
								<Fill>
									<CssParameter name="fill">#1f5f8b</CssParameter>
								</Fill>
								<Stroke>
									<CssParameter name="stroke">#ffffff</CssParameter>
									<CssParameter name="stroke-width">2</CssParameter>
								</Stroke>
							</Mark>
							<Size>14</Size>
						</Graphic>
					</PointSymbolizer>
				</Rule>
			</FeatureTypeStyle>
		</UserStyle>
	</NamedLayer>
</StyledLayerDescriptor>
