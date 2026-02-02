"""
Database Optimization Migrations for RUMI
Optimized indexes and query performance improvements
"""

from django.db import models, connection
from django.db.utils import ProgrammingError
import logging

logger = logging.getLogger(__name__)


class DatabaseOptimizer:
    """Database optimization utilities for vertical scaling"""
    
    @staticmethod
    def create_performance_indexes():
        """Create performance-optimized indexes for frequently queried fields"""
        
        indexes_sql = [
            # User and Authentication indexes
            """
            CREATE INDEX IF NOT EXISTS idx_accounts_user_email_active 
            ON accounts_user(email, is_active) 
            WHERE is_active = TRUE;
            """,
            
            """
            CREATE INDEX IF NOT EXISTS idx_accounts_user_role_created 
            ON accounts_user(role, date_joined DESC);
            """,
            
            """
            CREATE INDEX IF NOT EXISTS idx_accounts_user_last_login 
            ON accounts_user(last_login DESC) 
            WHERE last_login IS NOT NULL;
            """,
            
            # Hostel and Room indexes
            """
            CREATE INDEX IF NOT EXISTS idx_hostels_hostel_landlord_status 
            ON hostels_hostel(landlord_id, status, created_at DESC);
            """,
            
            """
            CREATE INDEX IF NOT EXISTS idx_hostels_hostel_location_price 
            ON hostels_hostel(city, base_price, available_rooms DESC);
            """,
            
            """
            CREATE INDEX IF NOT EXISTS idx_hostels_room_hostel_status 
            ON hostels_room(hostel_id, status);
            """,
            
            """
            CREATE INDEX IF NOT EXISTS idx_hostels_room_capacity_occupied 
            ON hostels_room(capacity, current_occupancy);
            """,
            
            # Booking indexes
            """
            CREATE INDEX IF NOT EXISTS idx_hostels_booking_student_status 
            ON hostels_booking(student_id, status, created_at DESC);
            """,
            
            """
            CREATE INDEX IF NOT EXISTS idx_hostels_booking_room_dates 
            ON hostels_booking(room_id, check_in_date, check_out_date);
            """,
            
            """
            CREATE INDEX IF NOT EXISTS idx_hostels_booking_landlord_status 
            ON hostels_booking(room_id, status, created_at DESC);
            """,
            
            # Payment indexes
            """
            CREATE INDEX IF NOT EXISTS idx_payments_transaction_student_status 
            ON payments_transaction(student_id, status, initiated_at DESC);
            """,
            
            """
            CREATE INDEX IF NOT EXISTS idx_payments_transaction_type_date 
            ON payments_transaction(transaction_type, initiated_at DESC);
            """,
            
            """
            CREATE INDEX IF NOT EXISTS idx_payments_transaction_amount 
            ON payments_transaction(amount, initiated_at DESC) 
            WHERE amount > 0;
            """,
            
            """
            CREATE INDEX IF NOT EXISTS idx_payments_mpesaconfig_landlord_status 
            ON payments_mpesapaymentconfig(landlord_id, status);
            """,
            
            # Notification indexes
            """
            CREATE INDEX IF NOT EXISTS idx_notifications_notification_user_read 
            ON notifications_notification(user_id, is_read, created_at DESC);
            """,
            
            """
            CREATE INDEX IF NOT EXISTS idx_notifications_notification_type_created 
            ON notifications_notification(notification_type, created_at DESC);
            """,
            
            # Analytics indexes
            """
            CREATE INDEX IF NOT EXISTS idx_analytics_dailyanalytics_date_type 
            ON analytics_dailyanalytics(date, analytics_type);
            """,
            
            """
            CREATE INDEX IF NOT EXISTS idx_analytics_revenueanalytics_date_landlord 
            ON analytics_revenueanalytics(date, landlord_id);
            """,
            
            # Message/Conversation indexes
            """
            CREATE INDEX IF NOT EXISTS idx_accounts_conversation_participants 
            ON accounts_conversation(participants);
            """,
            
            """
            CREATE INDEX IF NOT EXISTS idx_accounts_message_conversation_created 
            ON accounts_message(conversation_id, created_at DESC);
            """,
            
            # Activity Log indexes
            """
            CREATE INDEX IF NOT EXISTS idx_accounts_useractivitylog_user_action 
            ON accounts_useractivitylog(user_id, action, timestamp DESC);
            """,
            
            """
            CREATE INDEX IF NOT EXISTS idx_accounts_useractivitylog_timestamp 
            ON accounts_useractivitylog(timestamp DESC);
            """,
        ]
        
        with connection.cursor() as cursor:
            for sql in indexes_sql:
                try:
                    cursor.execute(sql)
                    logger.info(f"Created index: {sql.split('idx_')[1].split(' ')[0]}")
                except ProgrammingError as e:
                    if "already exists" not in str(e):
                        logger.error(f"Error creating index: {e}")
    
    @staticmethod
    def create_partitioned_tables():
        """Create partitioned tables for high-volume data"""
        
        # Partition user activity logs by month
        partition_sql = """
        -- Create partitioned table for user activity logs (if using PostgreSQL)
        CREATE TABLE IF NOT EXISTS accounts_useractivitylog_partitioned (
            LIKE accounts_useractivitylog INCLUDING ALL
        ) PARTITION BY RANGE (timestamp);
        
        -- Create monthly partitions
        CREATE TABLE IF NOT EXISTS accounts_useractivitylog_y2024m01 
        PARTITION OF accounts_useractivitylog_partitioned 
        FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
        
        CREATE TABLE IF NOT EXISTS accounts_useractivitylog_y2024m02 
        PARTITION OF accounts_useractivitylog_partitioned 
        FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
        """
        
        with connection.cursor() as cursor:
            try:
                cursor.execute(partition_sql)
                logger.info("Created partitioned tables")
            except ProgrammingError as e:
                logger.warning(f"Partitioning not supported or already exists: {e}")
    
    @staticmethod
    def optimize_database_settings():
        """Apply database performance settings"""
        
        if connection.vendor == 'postgresql':
            optimization_sql = [
                # Increase work_mem for complex queries
                "SET work_mem = '256MB';",
                
                # Increase maintenance_work_mem for index creation
                "SET maintenance_work_mem = '512MB';",
                
                # Optimize random_page_cost for SSD
                "SET random_page_cost = 1.1;",
                
                # Increase effective_cache_size
                "SET effective_cache_size = '4GB';",
                
                # Enable parallel query processing
                "SET max_parallel_workers_per_gather = 4;",
                "SET max_parallel_workers = 8;",
                
                # Optimize checkpoint settings
                "SET checkpoint_completion_target = 0.9;",
                "SET wal_buffers = '64MB';",
                
                # Statistics target for better query planning
                "ALTER TABLE accounts_user ALTER COLUMN email SET STATISTICS 1000;",
                "ALTER TABLE hostels_hostel ALTER COLUMN base_price SET STATISTICS 1000;",
                "ALTER TABLE payments_transaction ALTER COLUMN amount SET STATISTICS 1000;",
            ]
            
            with connection.cursor() as cursor:
                for sql in optimization_sql:
                    try:
                        cursor.execute(sql)
                        logger.info(f"Applied optimization: {sql}")
                    except ProgrammingError as e:
                        logger.warning(f"Could not apply optimization: {e}")
    
    @staticmethod
    def analyze_and_vacuum():
        """Run ANALYZE and VACUUM for query optimization"""
        
        with connection.cursor() as cursor:
            try:
                # Update table statistics
                cursor.execute("ANALYZE;")
                logger.info("Database ANALYZE completed")
                
                # Clean up dead tuples (PostgreSQL)
                if connection.vendor == 'postgresql':
                    cursor.execute("VACUUM ANALYZE;")
                    logger.info("Database VACUUM ANALYZE completed")
                    
            except ProgrammingError as e:
                logger.error(f"Error during maintenance: {e}")
    
    @staticmethod
    def create_materialized_views():
        """Create materialized views for complex queries"""
        
        materialized_views = [
            """
            CREATE MATERIALIZED VIEW IF NOT EXISTS mv_hostel_analytics AS
            SELECT 
                h.id,
                h.name,
                h.landlord_id,
                h.base_price,
                COUNT(r.id) as total_rooms,
                COUNT(CASE WHEN r.is_available = TRUE THEN 1 END) as available_rooms,
                COUNT(b.id) as total_bookings,
                COUNT(CASE WHEN b.status = 'active' THEN 1 END) as active_bookings,
                COALESCE(SUM(CASE WHEN b.status = 'active' THEN b.amount ELSE 0 END), 0) as total_revenue,
                h.created_at
            FROM hostels_hostel h
            LEFT JOIN hostels_room r ON h.id = r.hostel_id
            LEFT JOIN hostels_booking b ON r.id = b.room_id
            GROUP BY h.id, h.name, h.landlord_id, h.base_price, h.created_at;
            """,
            
            """
            CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_summary AS
            SELECT 
                u.id,
                u.email,
                u.role,
                u.date_joined,
                u.last_login,
                COUNT(CASE WHEN u.role = 'student' THEN b.id END) as student_bookings,
                COUNT(CASE WHEN u.role = 'landlord' THEN h.id END) as landlord_hostels,
                COALESCE(SUM(CASE WHEN u.role = 'student' THEN t.amount ELSE 0 END), 0) as total_spent,
                COALESCE(SUM(CASE WHEN u.role = 'landlord' THEN t.amount ELSE 0 END), 0) as total_earned
            FROM accounts_user u
            LEFT JOIN hostels_booking b ON u.id = b.student_id
            LEFT JOIN hostels_hostel h ON u.id = h.landlord_id
            LEFT JOIN payments_transaction t ON u.id = t.user_id
            GROUP BY u.id, u.email, u.role, u.date_joined, u.last_login;
            """,
        ]
        
        with connection.cursor() as cursor:
            for view_sql in materialized_views:
                try:
                    cursor.execute(view_sql)
                    logger.info(f"Created materialized view")
                except ProgrammingError as e:
                    logger.warning(f"Could not create materialized view: {e}")
    
    @staticmethod
    def create_indexes_for_materialized_views():
        """Create indexes for materialized views"""
        
        index_sql = [
            "CREATE INDEX IF NOT EXISTS idx_mv_hostel_analytics_landlord ON mv_hostel_analytics(landlord_id);",
            "CREATE INDEX IF NOT EXISTS idx_mv_hostel_analytics_price ON mv_hostel_analytics(base_price);",
            "CREATE INDEX IF NOT EXISTS idx_mv_user_summary_role ON mv_user_summary(role);",
            "CREATE INDEX IF NOT EXISTS idx_mv_user_summary_joined ON mv_user_summary(date_joined DESC);",
        ]
        
        with connection.cursor() as cursor:
            for sql in index_sql:
                try:
                    cursor.execute(sql)
                    logger.info(f"Created index for materialized view")
                except ProgrammingError as e:
                    logger.warning(f"Could not create index: {e}")


def run_database_optimization():
    """Run all database optimizations"""
    
    logger.info("Starting database optimization...")
    
    try:
        # Create performance indexes
        DatabaseOptimizer.create_performance_indexes()
        
        # Create partitioned tables
        DatabaseOptimizer.create_partitioned_tables()
        
        # Optimize database settings
        DatabaseOptimizer.optimize_database_settings()
        
        # Create materialized views
        DatabaseOptimizer.create_materialized_views()
        
        # Create indexes for materialized views
        DatabaseOptimizer.create_indexes_for_materialized_views()
        
        # Analyze and vacuum
        DatabaseOptimizer.analyze_and_vacuum()
        
        logger.info("Database optimization completed successfully!")
        
    except Exception as e:
        logger.error(f"Database optimization failed: {e}")
        raise


if __name__ == "__main__":
    import django
    import os
    
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rumi.settings')
    django.setup()
    
    run_database_optimization()
