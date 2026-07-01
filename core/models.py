from django.db import models
from django.contrib.auth.models import User
from cloudinary_storage.storage import MediaCloudinaryStorage

class Product(models.Model):
    name      = models.CharField(max_length=200)
    price     = models.DecimalField(max_digits=10, decimal_places=2)
    category  = models.CharField(max_length=100)
    stock     = models.IntegerField(default=1)
    emoji     = models.CharField(max_length=10, default='📦')
    image = models.ImageField(
        upload_to='products/',
        blank=True,
        null=True,
        storage=MediaCloudinaryStorage()
    )
    badge     = models.CharField(max_length=50, blank=True, null=True)
    featured  = models.BooleanField(default=False)
    rating    = models.FloatField(default=4.0)
    reviews   = models.IntegerField(default=0)
    desc      = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    unit = models.CharField(max_length=20, default='pcs')  # e.g. pcs, box, doz, set, kg, pair

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-featured', 'name']


class Invoice(models.Model):
    CLASSIFICATION_CHOICES = [
        ('#', '#'), ('##', '##'), ('###', '###'), ('★', '★'),
    ]

    # Right column — primary party
    pm_number   = models.CharField(max_length=50, blank=True, default='')  # P.M. field
    customer    = models.CharField(max_length=200, blank=True, default='')
    address     = models.CharField(max_length=300, blank=True, default='')
    station     = models.CharField(max_length=200, blank=True, default='')

    # Left column — optional billing party (B.N.)
    has_billing      = models.BooleanField(default=False)
    billing_name     = models.CharField(max_length=200, blank=True, default='')
    billing_address  = models.CharField(max_length=300, blank=True, default='')
    billing_station  = models.CharField(max_length=200, blank=True, default='')

    # Transport row
    transport   = models.CharField(max_length=200, blank=True, default='')
    gst_no      = models.CharField(max_length=30, blank=True, default='')
    phone       = models.CharField(max_length=20, blank=True, default='')

    date        = models.DateField()
    classification = models.CharField(max_length=5, choices=CLASSIFICATION_CHOICES, blank=True, default='')
    remark      = models.TextField(blank=True, default='')

    packing_charge  = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    booking_charge  = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    dori_qty        = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    total       = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_by  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice #{self.id} — {self.customer}"

    class Meta:
        ordering = ['-date', '-id']


class InvoiceItem(models.Model):
    invoice      = models.ForeignKey(Invoice, related_name='items', on_delete=models.CASCADE)
    product_name = models.CharField(max_length=200)
    qty          = models.IntegerField(default=1)
    price        = models.DecimalField(max_digits=10, decimal_places=2)
    discount_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # e.g. 10.00 = 10%

    def __str__(self):
        return f"{self.product_name} x{self.qty}"

    @property
    def amount(self):
        gross = self.qty * self.price
        discount_amt = gross * (self.discount_pct / 100)
        return gross - discount_amt