"""
Geographic utilities for distance calculations
"""
import math
from typing import Tuple, Union


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    
    Returns distance in kilometers
    """
    # Convert decimal degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = (math.sin(dlat/2)**2 + 
           math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2)
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    
    return c * r


def calculate_distance_from_university(hostel_lat: Union[float, None], 
                                hostel_lon: Union[float, None],
                                university_lat: Union[float, None] = None, 
                                university_lon: Union[float, None] = None) -> Union[float, None]:
    """
    Calculate distance from hostel to university
    
    Args:
        hostel_lat: Hostel latitude
        hostel_lon: Hostel longitude  
        university_lat: University latitude (default to common Nairobi universities)
        university_lon: University longitude (default to common Nairobi universities)
        
    Returns:
        Distance in kilometers or None if coordinates are missing
    """
    if not all([hostel_lat, hostel_lon]):
        return None
    
    # Default to University of Nairobi coordinates if not provided
    if university_lat is None or university_lon is None:
        university_lat = -1.2833  # University of Nairobi
        university_lon = 36.8177
    
    return round(haversine_distance(hostel_lat, hostel_lon, university_lat, university_lon), 2)


def get_kenyan_universities() -> dict:
    """
    Returns coordinates of major Kenyan universities
    
    Returns:
        Dictionary mapping university names to (lat, lon) tuples
    """
    return {
        'University of Nairobi': (-1.2833, 36.8177),
        'Kenyatta University': (-1.1804, 36.9318),
        'Jomo Kenyatta University': (-1.0982, 37.0143),
        'Moi University': (0.2842, 35.2806),
        'Egerton University': (-0.3718, 35.9333),
        'Maseno University': (0.0027, 34.5956),
        'Masinde Muliro University': (0.2842, 34.7753),
        'Dedan Kimathi University': (-0.6976, 37.1385),
        'Technical University of Kenya': (-1.2921, 36.8219),
        'KCA University': (-1.2309, 36.8876),
        'USIU': (-1.2245, 36.8855),
        'Daystar University': (-1.4000, 37.0333),
        'Strathmore University': (-1.2217, 36.8958),
        'Catholic University': (-1.2855, 36.8233),
    }


def find_nearest_university(hostel_lat: float, hostel_lon: float) -> Tuple[str, float]:
    """
    Find the nearest university to a given hostel
    
    Returns:
        Tuple of (university_name, distance_km)
    """
    universities = get_kenyan_universities()
    min_distance = float('inf')
    nearest_university = "Unknown"
    
    for university_name, (uni_lat, uni_lon) in universities.items():
        distance = haversine_distance(hostel_lat, hostel_lon, uni_lat, uni_lon)
        if distance < min_distance:
            min_distance = distance
            nearest_university = university_name
    
    return (nearest_university, round(min_distance, 2))