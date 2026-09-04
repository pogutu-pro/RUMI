"""
Management command to test roommate compatibility scoring
"""

from django.core.management.base import BaseCommand
from django.db.models import Q
from accounts.models import StudentProfile
from accounts.ml.compatibility_scorer import scorer
import json


class Command(BaseCommand):
    help = 'Test roommate compatibility scoring system'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--student1-id',
            type=int,
            help='First student ID for compatibility test'
        )
        parser.add_argument(
            '--student2-id', 
            type=int,
            help='Second student ID for compatibility test'
        )
        parser.add_argument(
            '--top-matches-for',
            type=int,
            help='Student ID to find top matches for'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=10,
            help='Number of top matches to return'
        )
        parser.add_argument(
            '--sample',
            action='store_true',
            help='Test with random sample of students'
        )
        parser.add_argument(
            '--sample-size',
            type=int,
            default=5,
            help='Number of random students to sample'
        )
    
    def handle(self, *args, **options):
        self.stdout.write("Testing Roommate Compatibility Scoring System")
        self.stdout.write("=" * 60)
        
        # Test specific pair
        if options['student1_id'] and options['student2_id']:
            self.test_pair_compatibility(options['student1_id'], options['student2_id'])
        
        # Test top matches
        elif options['top_matches_for']:
            self.test_top_matches(options['top_matches_for'], options['limit'])
        
        # Test with random sample
        elif options['sample']:
            self.test_random_sample(options['sample_size'])
        
        # Default: show system info and sample test
        else:
            self.show_system_info()
            self.test_random_sample(3)
    
    def test_pair_compatibility(self, student1_id: int, student2_id: int):
        """Test compatibility between two specific students"""
        self.stdout.write(f"\nTesting compatibility between Student {student1_id} and Student {student2_id}")
        
        try:
            student1 = StudentProfile.objects.get(id=student1_id)
            student2 = StudentProfile.objects.get(id=student2_id)
            
            result = scorer.calculate_compatibility_score(student1, student2)
            
            self.stdout.write(f"\nCompatibility Results:")
            self.stdout.write(f"   Final Score: {result['final_score']}/100")
            self.stdout.write(f"   Student 1: {student1.user.get_full_name()}")
            self.stdout.write(f"   Student 2: {student2.user.get_full_name()}")
            
            self.stdout.write(f"\nComponent Breakdown:")
            for component, score in result['component_scores'].items():
                weight = result['weights_used'][component]
                if score is not None:
                    self.stdout.write(f"   {component}: {score:.1f}/100 (weight: {weight}%)")
                else:
                    self.stdout.write(f"   {component}: No data (weight: {weight}%)")
            
        except StudentProfile.DoesNotExist as e:
            self.stdout.write(self.style.ERROR(f"Student not found: {e}"))
    
    def test_top_matches(self, student_id: int, limit: int):
        """Test finding top matches for a student"""
        self.stdout.write(f"\nFinding top {limit} matches for Student {student_id}")
        
        try:
            target_student = StudentProfile.objects.get(id=student_id)
            candidates = StudentProfile.objects.exclude(id=student_id)
            
            matches = scorer.find_top_matches(target_student, candidates, limit)
            
            self.stdout.write(f"\nTop {len(matches)} Matches for {target_student.user.get_full_name()}:")
            
            for i, match in enumerate(matches, 1):
                self.stdout.write(f"\n{i}. {match['student_name']} (ID: {match['student_id']})")
                self.stdout.write(f"   Score: {match['compatibility_score']}/100")
                
                # Show top 3 component scores
                sorted_components = sorted(
                    match['component_scores'].items(),
                    key=lambda x: x[1] if x[1] is not None else 0,
                    reverse=True
                )[:3]
                
                self.stdout.write("   Top factors:")
                for component, score in sorted_components:
                    if score is not None:
                        self.stdout.write(f"     - {component}: {score:.1f}/100")
            
        except StudentProfile.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Student {student_id} not found"))
    
    def test_random_sample(self, sample_size: int):
        """Test with random sample of students"""
        self.stdout.write(f"\nTesting with random sample of {sample_size} students")
        
        # Get students with lifestyle preferences
        students_with_data = StudentProfile.objects.filter(
            Q(lifestyle_preferences__isnull=False) & 
            ~Q(lifestyle_preferences={})
        ).exclude(user__first_name='', user__last_name='')
        
        if students_with_data.count() < sample_size:
            self.stdout.write(
                self.style.WARNING(
                    f"Only {students_with_data.count()} students with lifestyle preferences found"
                )
            )
            sample_size = students_with_data.count()
        
        if sample_size == 0:
            self.stdout.write(self.style.ERROR("No students with lifestyle preferences found"))
            return
        
        # Sample students
        import random
        sampled_students = random.sample(list(students_with_data), min(sample_size, len(students_with_data)))
        
        self.stdout.write(f"\nSample Students:")
        for student in sampled_students:
            self.stdout.write(f"   - {student.user.get_full_name()} (ID: {student.id})")
            self.stdout.write(f"     Course: {student.course or 'Not specified'}")
            self.stdout.write(f"     University: {student.university or 'Not specified'}")
            prefs = student.lifestyle_preferences or {}
            self.stdout.write(f"     Lifestyle prefs: {list(prefs.keys())}")
        
        # Test all pairwise combinations
        self.stdout.write(f"\nPairwise Compatibility Tests:")
        
        for i, student1 in enumerate(sampled_students):
            for j, student2 in enumerate(sampled_students[i+1:], i+1):
                result = scorer.calculate_compatibility_score(student1, student2)
                
                self.stdout.write(
                    f"\n{student1.user.get_full_name()} ↔ {student2.user.get_full_name()}:"
                )
                self.stdout.write(f"   Score: {result['final_score']}/100")
                
                # Show meaningful components
                meaningful_scores = {
                    comp: score for comp, score in result['component_scores'].items()
                    if score is not None
                }
                
                if meaningful_scores:
                    best_component = max(meaningful_scores.items(), key=lambda x: x[1])
                    self.stdout.write(f"   Best match factor: {best_component[0]} ({best_component[1]:.1f}/100)")
    
    def show_system_info(self):
        """Show system statistics and information"""
        self.stdout.write("\nSystem Information:")
        
        total_students = StudentProfile.objects.count()
        students_with_lifestyle = StudentProfile.objects.filter(
            Q(lifestyle_preferences__isnull=False) & 
            ~Q(lifestyle_preferences={})
        ).count()
        students_with_bio = StudentProfile.objects.exclude(bio='').count()
        
        self.stdout.write(f"   Total students: {total_students}")
        self.stdout.write(f"   Students with lifestyle preferences: {students_with_lifestyle}")
        self.stdout.write(f"   Students with bios: {students_with_bio}")
        
        # Show sample lifestyle preference keys
        sample_prefs = StudentProfile.objects.filter(
            lifestyle_preferences__isnull=False
        ).exclude(lifestyle_preferences={}).first()
        
        if sample_prefs and sample_prefs.lifestyle_preferences:
            self.stdout.write(f"\nSample lifestyle preference keys:")
            for key in list(sample_prefs.lifestyle_preferences.keys())[:10]:
                self.stdout.write(f"   - {key}")
        
        self.stdout.write(f"\nScoring Weights:")
        for component, weight in scorer.weights.items():
            self.stdout.write(f"   - {component}: {weight}%")
