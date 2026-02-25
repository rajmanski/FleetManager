package routes

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

const maxWaypoints = 10

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
type LatLng struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type CalculateResult struct {
	DistanceKm      float64 `json:"distance_km"`
	DurationMinutes int     `json:"duration_minutes"`
	Polyline        string  `json:"polyline"`
}

type directionsAPIResponse struct {
	Status  string `json:"status"`
	Routes  []struct {
		OverviewPolyline struct {
			Points string `json:"points"`
		} `json:"overview_polyline"`
		Legs []struct {
			Distance struct {
				Value int `json:"value"`
			} `json:"distance"`
			Duration struct {
				Value int `json:"value"`
			} `json:"duration"`
		} `json:"legs"`
	} `json:"routes"`
}

func (s *Service) Calculate(origin, destination LatLng, waypoints []LatLng) (*CalculateResult, error) {
	if s.apiKey == "" {
		return nil, ErrAPIKeyNotConfigured
	}
	if len(waypoints) > maxWaypoints {
		return nil, ErrTooManyWaypoints
	}

	originStr := fmt.Sprintf("%s,%s", formatCoord(origin.Lat), formatCoord(origin.Lng))
	destStr := fmt.Sprintf("%s,%s", formatCoord(destination.Lat), formatCoord(destination.Lng))

	u := "https://maps.googleapis.com/maps/api/directions/json"
	params := url.Values{}
	params.Set("origin", originStr)
	params.Set("destination", destStr)
	params.Set("key", s.apiKey)
	if len(waypoints) > 0 {
		parts := make([]string, len(waypoints))
		for i, wp := range waypoints {
			parts[i] = fmt.Sprintf("%s,%s", formatCoord(wp.Lat), formatCoord(wp.Lng))
		}
		params.Set("waypoints", strings.Join(parts, "|"))
	}

	reqURL := u + "?" + params.Encode()
	resp, err := http.Get(reqURL)
	if err != nil {
		return nil, fmt.Errorf("directions request failed: %w", err)
	}
	defer resp.Body.Close()

	var data directionsAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("parsing directions response: %w", err)
	}

	switch data.Status {
	case "OK":
		if len(data.Routes) == 0 || len(data.Routes[0].Legs) == 0 {
			return nil, ErrRouteNotFound
		}
		route := data.Routes[0]
		var totalDistM int
		var totalDurSec int
		for _, leg := range route.Legs {
			totalDistM += leg.Distance.Value
			totalDurSec += leg.Duration.Value
		}
		return &CalculateResult{
			DistanceKm:      float64(totalDistM) / 1000,
			DurationMinutes: totalDurSec / 60,
			Polyline:        route.OverviewPolyline.Points,
		}, nil
	case "ZERO_RESULTS", "NOT_FOUND":
		return nil, ErrRouteNotFound
	case "REQUEST_DENIED":
		return nil, ErrGeocodingDenied
	case "OVER_QUERY_LIMIT":
		return nil, ErrGeocodingQuotaExceeded
	case "INVALID_REQUEST":
		return nil, ErrInvalidRequest
	default:
		return nil, fmt.Errorf("directions api error: %s", data.Status)
	}
}

func formatCoord(v float64) string {
	return strconv.FormatFloat(v, 'f', -1, 64)
}
