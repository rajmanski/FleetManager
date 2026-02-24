package routes

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
)

type Service struct {
	apiKey string
}

func NewService(apiKey string) *Service {
	return &Service{apiKey: apiKey}
}

type GeocodeResult struct {
	Address   string  `json:"address"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type geocodeAPIResponse struct {
	Status  string `json:"status"`
	Results []struct {
		Geometry struct {
			Location struct {
				Lat float64 `json:"lat"`
				Lng float64 `json:"lng"`
			} `json:"location"`
		} `json:"geometry"`
		FormattedAddress string `json:"formatted_address"`
	} `json:"results"`
}

func (s *Service) Geocode(address string) (*GeocodeResult, error) {
	if s.apiKey == "" {
		return nil, ErrAPIKeyNotConfigured
	}
	if address == "" {
		return nil, ErrAddressRequired
	}

	u := "https://maps.googleapis.com/maps/api/geocode/json"
	reqURL := fmt.Sprintf("%s?address=%s&key=%s", u, url.QueryEscape(address), url.QueryEscape(s.apiKey))

	resp, err := http.Get(reqURL)
	if err != nil {
		return nil, fmt.Errorf("geocoding request failed: %w", err)
	}
	defer resp.Body.Close()

	var data geocodeAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("parsing geocoding response: %w", err)
	}

	switch data.Status {
	case "OK":
		if len(data.Results) == 0 {
			return nil, ErrAddressNotFound
		}
		first := data.Results[0]
		return &GeocodeResult{
			Address:   first.FormattedAddress,
			Latitude:  first.Geometry.Location.Lat,
			Longitude: first.Geometry.Location.Lng,
		}, nil
	case "ZERO_RESULTS":
		return nil, ErrAddressNotFound
	case "REQUEST_DENIED":
		return nil, ErrGeocodingDenied
	case "OVER_QUERY_LIMIT":
		return nil, ErrGeocodingQuotaExceeded
	case "INVALID_REQUEST":
		return nil, ErrInvalidRequest
	default:
		return nil, fmt.Errorf("geocoding api error: %s", data.Status)
	}
}
