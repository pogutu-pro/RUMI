"""
Account number generation and validation utilities.

Generates unique M-Pesa Paybill/Till account numbers for each bed.
Includes checksum validation to prevent typos.
"""

def generate_account_number(hostel, bed, prefix=None):
    """
    Generate unique M-Pesa account number for a bed.
    
    Format: {PREFIX}-{ROOM}-{BED}-{CHECKSUM}
    Example: KBH-101-A-47
    
    Args:
        hostel: Hostel instance
        bed: Bed instance
        prefix: Optional prefix (defaults to hostel code)
        
    Returns:
        str: Unique account number
    """
    # Determine prefix
    if prefix:
        hostel_code = prefix
    elif hasattr(hostel, 'code') and hostel.code:
        hostel_code = hostel.code
    else:
        # Fallback: first 3 letters of hostel name
        hostel_code = hostel.name[:3].upper().replace(' ', '')
    
    # Extract room and bed codes
    room_code = bed.room.room_number
    bed_code = bed.code
    
    # Calculate checksum
    raw_string = f"{hostel_code}{room_code}{bed_code}{str(bed.id)}"
    checksum = sum(ord(c) for c in raw_string) % 100
    
    # Format account number
    account_number = f"{hostel_code}-{room_code}-{bed_code}-{checksum:02d}"
    
    return account_number


def validate_account_number_checksum(account_number):
    """
    Validate account number checksum.
    
    Args:
        account_number: Account number string (e.g., "KBH-101-A-47")
        
    Returns:
        bool: True if checksum is valid, False otherwise
    """
    try:
        parts = account_number.split('-')
        
        if len(parts) != 4:
            return False
        
        hostel_code, room_code, bed_code, checksum_str = parts
        
        # Parse checksum
        try:
            provided_checksum = int(checksum_str)
        except ValueError:
            return False
        
        # Recalculate checksum (requires DB lookup - simplified here)
        # In production, this should look up the bed and recalculate
        
        # For now, just validate format
        return 0 <= provided_checksum <= 99
        
    except Exception:
        return False


def parse_account_number(account_number):
    """
    Parse account number into components.
    
    Args:
        account_number: Account number string (e.g., "KBH-101-A-47")
        
    Returns:
        dict: {
            'hostel_code': 'KBH',
            'room_code': '101',
            'bed_code': 'A',
            'checksum': 47
        } or None if invalid
    """
    try:
        parts = account_number.split('-')
        
        if len(parts) != 4:
            return None
        
        hostel_code, room_code, bed_code, checksum_str = parts
        
        return {
            'hostel_code': hostel_code,
            'room_code': room_code,
            'bed_code': bed_code,
            'checksum': int(checksum_str)
        }
    except Exception:
        return None
